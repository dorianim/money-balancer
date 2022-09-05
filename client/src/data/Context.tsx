import { AlertColor } from '@mui/material';
import { createContext } from 'react';
import { User } from './Types';

interface ErrorData {
  open: boolean;
  severity: AlertColor;
  message: string;
}

/**
 * Creates a Context that is accessible to all nodes wrapped in the context provider
 * @return {React.Context}
 */
export const Context = createContext<{
  title: string;
  setTitle: (title: string) => void;

  token: string;
  setToken: (token: string) => void;

  user: User | undefined;
  setUser: (user: User) => void;

  error: ErrorData;
  setError: (error: ErrorData) => void;

  loginRedirectUrl: string;
  setLoginRedirectUrl: (url: string) => void;
}>({
  title: '',
  setTitle: () => {
    return;
  },

  token: '',
  setToken: () => {
    return;
  },

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
});
