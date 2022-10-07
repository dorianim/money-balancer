import { ErrorData } from './Context';
import {
  AvailableAuthenticationProviders,
  Debt,
  Group,
  Transaction,
  User,
} from './Types';

export const URL =
  !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000/api/v1'
    : '/api/v1';

interface ReducedContextType {
  token: string;
  setToken: (token: string) => void;
  setError: (error: ErrorData) => void;
}

export class MoneyBalancerApi {
  private _context: ReducedContextType;
  private _token: string;

  constructor(context: ReducedContextType) {
    this._context = context;
    this._token = context.token;
  }

  private async _authorizedFetch(path: string, init?: RequestInit | undefined) {
    const newHeaders = new Headers(init?.headers);
    newHeaders.set('Authorization', `Bearer ${this._token}`);
    init = { ...init, headers: newHeaders };
    return await this._fetch(path, init);
  }

  private async _fetch(path: string, init?: RequestInit | undefined) {
    const newHeaders = new Headers(init?.headers);
    newHeaders.set('Accept', 'application/json');
    init = { ...init, headers: newHeaders };

    try {
      return await fetch(`${URL}${path}`, init);
    } catch (e) {
      let error = '';
      if (typeof e === 'string') {
        error = e.toUpperCase();
      } else if (e instanceof Error) {
        error = e.message;
      }

      this._context.setError({ message: error, severity: 'error', open: true });
      return undefined;
    }
  }

  private async _error(r: Response, ...acceptedStatusCodes: number[]) {
    if (acceptedStatusCodes.indexOf(r.status) >= 0) {
      this._resetError();
      return false;
    }

    const data = await r.json();
    this._context.setError({
      message: data.error.description,
      severity: 'error',
      open: true,
    });
    return true;
  }

  private _resetError() {
    this._context.setError({ message: '', severity: 'info', open: false });
  }

  private _setToken(token: string) {
    this._token = token;
    this._context.setToken(token);
  }

  loggedIn() {
    return this._token !== '';
  }

  async logout() {
    this._setToken('');
  }

  async getAvailableAuthenticationProviders(): Promise<
    AvailableAuthenticationProviders | undefined
  > {
    const r = await this._fetch('/auth', {
      method: 'GET',
    });

    if (!r || (await this._error(r, 200))) {
      return undefined;
    }

    const json = await r.json();
    return json;
  }

  async localLogin(username: string, password: string) {
    const r = await this._fetch('/user/token', {
      method: 'POST',
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    if (!r || (await this._error(r, 200))) {
      return false;
    }

    const json = await r.json();
    this._setToken(json.token);
    return true;
  }

  async proxyLogin() {
    const r = await this._fetch('/auth/proxy', {
      method: 'POST',
    });

    if (!r || (await this._error(r, 200))) {
      return false;
    }

    const json = await r.json();
    this._setToken(json.token);
    return true;
  }

  async proxyRedirect() {
    window.location.href = `${URL}/auth/proxy`;
  }

  async createUser(
    username: string,
    nickname: string,
    password: string,
  ): Promise<User | undefined> {
    const r = await this._fetch('/user', {
      method: 'POST',
      body: JSON.stringify({
        username: username,
        password: password,
        nickname: nickname,
      }),
    });

    if (!r || (await this._error(r, 200))) {
      return undefined;
    }

    return await r.json();
  }

  async getUser(): Promise<User | undefined> {
    const r = await this._authorizedFetch('/user', {
      method: 'GET',
    });

    if (!r || (await this._error(r, 200))) {
      return undefined;
    }

    const json = await r.json();
    return json;
  }

  async createGroup(name: string): Promise<Group | undefined> {
    const r = await this._authorizedFetch('/group', {
      method: 'POST',
      body: JSON.stringify({
        name: name,
      }),
    });

    if (!r || (await this._error(r, 200))) {
      return undefined;
    }

    const json = await r.json();
    return json;
  }

  async getGroup(id: string): Promise<Group | undefined> {
    const r = await this._authorizedFetch('/group/' + id, {
      method: 'GET',
    });

    if (!r || (await this._error(r, 200))) {
      return undefined;
    }

    const json = await r.json();
    return json;
  }

  async joinGroup(id: string): Promise<boolean> {
    const r = await this._authorizedFetch(`/group/${id}/member`, {
      method: 'POST',
    });

    if (!r || (await this._error(r, 200))) {
      return false;
    }

    return true;
  }

  async createTransaction(
    groupId: string,
    amount: number,
    description: string,
    debtorIds: string[],
  ): Promise<Group | undefined> {
    const r = await this._authorizedFetch(`/group/${groupId}/transaction`, {
      method: 'POST',
      body: JSON.stringify({
        amount: Math.trunc(amount),
        description: description,
        debtor_ids: debtorIds,
      }),
    });

    if (!r || (await this._error(r, 200))) {
      return undefined;
    }

    const json = await r.json();
    return json;
  }

  async deleteTransactionOfGroup(
    groupId: string,
    transactionId: string,
  ): Promise<boolean> {
    const r = await this._authorizedFetch(
      `/group/${groupId}/transaction/${transactionId}`,
      {
        method: 'DELETE',
      },
    );

    if (!r || (await this._error(r, 200))) {
      return false;
    }

    return true;
  }

  async getTransactionsOfGroup(
    groupId: string,
  ): Promise<Transaction[] | undefined> {
    const r = await this._authorizedFetch(`/group/${groupId}/transaction`, {
      method: 'GET',
    });

    if (!r || (await this._error(r, 200))) {
      return undefined;
    }

    const json = await r.json();
    return json;
  }

  async getDebtsOfGroup(groupId: string): Promise<Debt[] | undefined> {
    const r = await this._authorizedFetch(`/group/${groupId}/debt`, {
      method: 'GET',
    });

    if (!r || (await this._error(r, 200))) {
      return undefined;
    }

    const json = await r.json();
    return json;
  }
}
