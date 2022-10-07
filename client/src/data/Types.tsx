export interface User {
  id: string;
  username: string;
  nickname: string;
  groups: Group[];
}

export interface Group {
  id: string;
  name: string;
  members: GroupMember[];
}

export interface GroupMember {
  id: string;
  nickname: string;
  is_owner: boolean;
}

export interface Transaction {
  id: string;
  group_id: string;
  creditor_id: string;
  timestamp: number;
  description: string;
  debts: Debt[];
}

export interface Debt {
  debtor_id: string;
  amount: number;
  was_split_unequally: boolean;
}

export interface AvailableAuthenticationProviders {
  local: {
    enabled: boolean;
  };
  proxy: {
    enabled: boolean;
  };
}
