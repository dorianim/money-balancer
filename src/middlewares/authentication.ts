
import { Router, Route, Request } from 'itty-router';
import { AuthenticatedRequest, Env, User } from '../utils/types';
import {JWTPayload, jwtVerify} from 'jose';
import { json, sha256 } from '../utils/utils';
import { JWSInvalid } from 'jose/dist/types/util/errors';

const encoder = new TextEncoder(); 

export async function requireAuthentication(request: AuthenticatedRequest, env: Env) {
    console.log(request.headers.get("Authorization"))
    const authHeader = request.headers.get("Authorization") || ''
    if(!authHeader.startsWith("Bearer ")) {
        return json({message: "Invalid authorization header"}, 400);
    }

    const jwt = authHeader.substring(7, authHeader.length);

    let payload: JWTPayload;

    try {
        const result = await jwtVerify(jwt, encoder.encode(env.ENV_JWT_SECRET), {
            issuer: "de:itsblue:money-balancer",
        })

        payload = result.payload;
    } catch (error: JWSInvalid) {
        return json({message: "Invalid authorization token"}, 401);
    }

    // validate payload
    const authenticatedUser: User = {
        username: payload.preferred_username as string,
        nickname: payload.nickname as string,
        balances: [],
        id: await sha256(payload.preferred_username as string)
    };

    request.user = authenticatedUser;
}