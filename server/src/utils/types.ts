import { Request } from 'itty-router'
export type MethodType = 'GET' | 'POST' | 'PUPPY';

export interface Env {
	BALANCES: KVNamespace;
	USERS: KVNamespace;

	ENV_JWT_SECRET: string;
}

interface Balances {
	[balanceId: string]: {
		name: string
	};
}

export interface PublicUser {
	id: string;
	username: string;
	nickname: string;
}

export interface User {
	id: string;
	username: string;
	nickname: string;
	balances: Balances;
}

export interface ExtendedRequest extends Request {
	method: MethodType // method is required to be on the interface
	url: string // url is required to be on the interface
	headers: Headers
}

export interface AuthenticatedRequest extends ExtendedRequest {
	user: User
}

export interface Purchase {
	timestamp: number;
	amount: number;
	purchaser: string;
	consumers: string[];
	description: string;
}

interface Users {
	[id: string]: PublicUser;
}

interface UserBalances {
	[id: string]: number;
}

export interface Balance {
	id: string;
	name: string;
	owner: string;
	userBalances: UserBalances;
	users: Users;
	purchases: Purchase[];
}