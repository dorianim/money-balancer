import { Router, Route, Request } from 'itty-router'
import { json, sha256 } from '../utils/utils';
import {v4 as uuidv4} from 'uuid';
import { Env, AuthenticatedRequest, Balance, User } from '../utils/types';

interface BalanceCreationRequest {
  name?: string,
}

export default function register(router: Router) {
    router.post("/", createBalance)
    router.get("/:balanceId", getBalance)
    router.post("/:balanceId", joinBalance)
    router.post("/:balanceId/purchase", createPurchase)
}

async function getBalance(request: AuthenticatedRequest, env: Env) {
    const balanceId = decodeURIComponent(request.params?.balanceId || '');
    const rawBalanceData = await env.BALANCES.get(balanceId);
  
    if(!rawBalanceData) {
      return json({message: `Balance ${balanceId} not found!`}, 404);
    }
  
    const balanceData: Balance = JSON.parse(rawBalanceData);

    // check if user is in users
    if(!balanceData.users[request.user.id]) {
      return json({message: "You don't have access to this balance!"}, 403);
    }

    return json(balanceData);
}

async function createBalance(request: AuthenticatedRequest, env: Env) {
  if(!request.json) {
    return json({message: "invalid request, content type has to be application/json"}, 400);
  }

  const balanceRequest: BalanceCreationRequest = await request.json();

  if(!balanceRequest.name) {
    return json({message: "name missing!"}, 400);
  }

  let balanceId = "";
  do {
    balanceId = await sha256(uuidv4());
  } while(await env.BALANCES.get(balanceId));
  
  const balanceData: Balance = {
    name: balanceRequest.name,
    id: balanceId,
    owner: request.user.id,
    users: {[request.user.id]: {id: request.user.id, username: request.user.username, nickname: request.user.nickname}},
    purchases: [],
    userBalances: {},
  }

  await env.BALANCES.put(balanceId, JSON.stringify(balanceData));

  // update user
  if((await addUserToBalance(request.user.id, balanceData.id, env))?.status !== 200) {
    return json({message: "failed to add user to balance"}, 500);
  }

  return json(balanceData);
}

async function joinBalance(request: AuthenticatedRequest, env: Env) {
  const balanceId = decodeURIComponent(request.params?.balanceId || '');
  return addUserToBalance(request.user.id, balanceId, env);
}

interface PurchaseCreationRequest {
  amount: number,
  consumers: string[],
  description: string,
}

async function createPurchase(request: AuthenticatedRequest, env: Env) {
  // validate request
  if(!request.json) {
    return json({message: "invalid request, content type has to be application/json"}, 400);
  }

  const purchaseRequest: PurchaseCreationRequest = await request.json();
  if(!purchaseRequest.amount || !purchaseRequest.consumers || !purchaseRequest.description) {
    return json({message: "missing parameters"}, 400);
  }

  // make sure, amount is a full, positive number
  if(purchaseRequest.amount <= 0 || !Number.isInteger(purchaseRequest.amount)) {
    return json({message: "amount has to be a positive integer"}, 400);
  }

  const balanceId = decodeURIComponent(request.params?.balanceId || '');
  // load balance
  const rawBalanceData = await env.BALANCES.get(balanceId);
  if(!rawBalanceData) {
    console.log(`Balance ${balanceId} not found!`);
    return json({message: `Balance ${balanceId} not found!`}, 404);
  } 

  const balanceData: Balance = JSON.parse(rawBalanceData);

  // check if user is in users
  if(!balanceData.users[request.user.id]) {
    return json({message: "You don't have access to this balance!"}, 403);
  }

  // check if all consumers are in users
  for(const consumer of purchaseRequest.consumers) {
    if(!balanceData.users[consumer]) {
      return json({message: `consumer ${consumer} is not in the balance`}, 400);
    }
  }

  // add purchase
  balanceData.purchases.push({timestamp: new Date().getTime(), amount: purchaseRequest.amount, purchaser: request.user.id, consumers: purchaseRequest.consumers, description: purchaseRequest.description});

  // update user balances
  const pricePerConsumer = purchaseRequest.amount / purchaseRequest.consumers.length;
  for(const consumer of purchaseRequest.consumers) {
    if(consumer === request.user.id) {
      continue;
    }
    const userBalanceKey = [consumer, request.user.id].sort().join(':');
    if(!balanceData.userBalances[userBalanceKey]) {
      balanceData.userBalances[userBalanceKey] = 0;
    }
    if(consumer < request.user.id) {
      balanceData.userBalances[userBalanceKey] -= pricePerConsumer;
    }
    else {
      balanceData.userBalances[userBalanceKey] += pricePerConsumer;
    }
  }

  // update balance
  await env.BALANCES.put(balanceData.id, JSON.stringify(balanceData));
  return json(balanceData);
}

async function addUserToBalance(userId: string, balanceId: string, env: Env) {
  // load balance
  const rawBalanceData = await env.BALANCES.get(balanceId);
  if(!rawBalanceData) {
    console.log(`Balance ${balanceId} not found!`);
    return json({message: `Balance ${balanceId} not found!`}, 404);
  }
  const balanceData: Balance = JSON.parse(rawBalanceData);

  // load user
  const rawUserData = await env.USERS.get(userId);
  if(!rawUserData) {
    console.log(`User ${userId} not found!`);
    return json({message: `User ${userId} not found!`}, 500);
  }
  const userData: User = JSON.parse(rawUserData);

  // update user
  userData.balances[balanceId] = {name: balanceData.name};
  await env.USERS.put(userId, JSON.stringify(userData));

  // update balance
  balanceData.users[userData.id] = {id: userData.id, username: userData.username, nickname: userData.nickname};
  await env.BALANCES.put(balanceData.id, JSON.stringify(balanceData));

  return json(balanceData);
}