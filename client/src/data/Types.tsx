interface Balances {
  [balanceId: string]: {
    name: string;
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

export interface UserBalances {
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
