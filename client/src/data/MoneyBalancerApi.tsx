import { ErrorData } from './Context';

export const URL = 'https://money-balancer.itsblue.workers.dev';

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
    this._token = '';
  }

  private async _authorizedFetch(path: string, init?: RequestInit | undefined) {
    const newHeaders = new Headers(init?.headers);
    newHeaders.set('Authorization', `Bearer ${this._token}`);
    init = { ...init, headers: newHeaders };
    return await this._fetch(path, init);
  }

  private async _fetch(path: string, init?: RequestInit | undefined) {
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

  private async _error(r?: Response) {
    if (!r) return undefined;
    const data = await r.json();
    this._context.setError({
      message: data.message,
      severity: 'error',
      open: true,
    });
    return undefined;
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

  async login(username: string, password: string) {
    const r = await this._fetch('/user/token', {
      method: 'POST',
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    if (!r || r.status !== 200) {
      this._setToken('');
      await this._error(r);
      return false;
    }

    const json = await r.json();
    this._setToken(json.token);
    return true;
  }

  async createUser(username: string, nickname: string, password: string) {
    const r = await this._fetch('/user', {
      method: 'POST',
      body: JSON.stringify({
        username: username,
        password: password,
        nickname: nickname,
      }),
    });

    if (!r || r.status !== 200) {
      return await this._error(r);
    }

    return await r.json();
  }

  async getUser() {
    const r = await this._authorizedFetch('/user', {
      method: 'GET',
    });

    if (!r || r.status !== 200) {
      return await this._error(r);
    }

    const json = await r.json();
    return json;
  }

  async createBalance(name: string) {
    const r = await this._authorizedFetch('/balance', {
      method: 'POST',
      body: JSON.stringify({
        name: name,
      }),
    });

    if (!r || r.status !== 200) {
      return await this._error(r);
    }

    const json = await r.json();
    return json;
  }

  async getBalances() {
    const r = await this._authorizedFetch('/balance', {
      method: 'GET',
    });

    if (!r || r.status !== 200) {
      return await this._error(r);
    }

    const json = await r.json();
    return json;
  }

  async getBalance(id: number) {
    const r = await this._authorizedFetch('/balance/' + id, {
      method: 'GET',
    });

    if (!r || r.status !== 200) {
      return await this._error(r);
    }

    const json = await r.json();
    return json;
  }
}
