import { AlertColor } from '@mui/material';
import { createContext } from 'react';
import { MoneyBalancerApi } from './MoneyBalancerApi';
import { User } from './Types';

export interface ErrorData {
  open: boolean;
  severity: AlertColor;
  message: string;
}

export interface ContextType {
  title: string;
  setTitle: (title: string) => void;

  token: string;

  user: User | undefined;
  setUser: (user: User) => void;

  error: ErrorData;
  setError: (error: ErrorData) => void;

  loginRedirectUrl: string;
  setLoginRedirectUrl: (url: string) => void;

  goBackToUrl: string | undefined;
  setGoBackToUrl: (goBackToUrl: string | undefined) => void;

  api: MoneyBalancerApi;
}

/**
 * Creates a Context that is accessible to all nodes wrapped in the context provider
 * @return {React.Context}
 */
export const Context = createContext<ContextType>({
  title: '',
  setTitle: () => {
    return;
  },

  token: '',

  user: undefined,
  setUser: () => {
    return;
  },

  error: { open: false, severity: 'info', message: '' },
  setError: () => {
    return;
  },

  loginRedirectUrl: '',
  setLoginRedirectUrl: () => {
    return;
  },

  api: new MoneyBalancerApi({
    token: '',
    setToken: () => {
      return;
    },
    setError: () => {
      return;
    },
  }),

  goBackToUrl: undefined,
  setGoBackToUrl: () => {
    return;
  },
});
