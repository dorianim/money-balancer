
import { Router, Route, Request } from 'itty-router'
import {v4 as uuidv4} from 'uuid';
import { requireAuthentication } from '../middlewares/authentication';
import { json, sha256 } from '../utils/utils';
import { Env, AuthenticatedRequest, User } from '../utils/types';
import {SignJWT} from 'jose';

interface UserCreationRequest {
  username?: string,
  nickname?: string,
  password?: string,
}

interface InternalUser extends User {
  password: string;
}

const encoder = new TextEncoder(); 

export default function register(router: Router) {
    router.get("/", requireAuthentication, getUser)

    router.post("/", createUser)

    router.post("/token", authenticateUser)
}

async function getUser(request: AuthenticatedRequest, env: Env) {
    const user = request.user;
    // get user from env
    const rawUserData = await env.USERS.get(user.id);
    if(!rawUserData) {
      return json({message: `User ${user.id} not found!`}, 404);
    }

    const userData: InternalUser = JSON.parse(rawUserData);

    return json({username: userData.username, nickname: userData.nickname, id: user.id, balances: userData.balances});
}

async function createUser(request: Request, env: Env) {
    if(!request.json) {
      return json({message: "invalid request, content type has to be application/json"}, 400);
    }
  
    const userData: UserCreationRequest = await request.json();
  
    if(!userData.username || !userData.nickname || !userData.password) {
      return json({message: "username, nickname or password missing!"}, 400);
    }
  
    const userId = await sha256(userData.username);
  
    if(await env.USERS.get(userId)) {
      return json({message: "username already exists"}, 400);
    }
  
    const hashSalt = uuidv4();
    const hashedPassword = await sha256(userData.password + hashSalt) + ":" + hashSalt;
  
    env.USERS.put(userId, JSON.stringify({id:userId, username: userData.username, nickname: userData.nickname, password: hashedPassword, balances: []}));
  
    return json({username: userData.username, nickname: userData.nickname, id: userId})
  }

  async function authenticateUser(request: Request, env: Env) {
    if(!request.json) {
      return json({message: "invalid request, content type has to be application/json"}, 400);
    }
    
    const userRequest: UserCreationRequest = await request.json();

    if(!userRequest.username || !userRequest.password) {
      return json({message: "username, fullName or password missing!"}, 400);
    }

    const userId = await sha256(userRequest.username);
    const user = await env.USERS.get(userId)
    if(!user) {
      return json({message: "invalid username or password"}, 401);
    }

    const userData: InternalUser = JSON.parse(user);
    const hashSalt = userData.password.split(":")[1];
    const hashedPassword = await sha256(userRequest.password.split(":")[0] + hashSalt) + ":" + hashSalt;
    if(hashedPassword !== userData.password) {
      return json({message: "invalid username or password"}, 401);
    }

    const jwt = await new SignJWT({preferred_username: userData.username, nickname: userData.nickname})
      .setProtectedHeader({ alg: 'HS512' })
      .setIssuedAt()
      .setIssuer('de:itsblue:money-balancer')
      .setExpirationTime('2h')
      .sign(encoder.encode(env.ENV_JWT_SECRET));
  
    return json({token: jwt});
  }