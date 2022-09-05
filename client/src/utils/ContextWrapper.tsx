import { useEffect, useState } from 'react';
import { Context, ErrorData } from '../data/Context';
import { MoneyBalancerApi } from '../data/MoneyBalancerApi';
import { User } from '../data/Types';

interface StoredContext {
  token: string;
  loginRedirectUrl: string;
  user: User | undefined;
}

/**
 * Sets Context for its children
 * @param  {{ children: JSX.Element }} props
 * @return {JSX.Element}
 */
export default function ContextWrapper(props: { children: JSX.Element }) {
  const { children } = props;

  let storedContext: StoredContext = {
    token: '',
    loginRedirectUrl: '/',
    user: undefined,
  };

  // load old values from localstorage
  const storedContextJSON = localStorage.getItem(
    'de.itsblue.money-balancer.context',
  );
  if (storedContextJSON !== null) {
    storedContext = {
      ...storedContext,
      ...JSON.parse(storedContextJSON),
    };
  }

  const [title, setTitle] = useState('Money Balancer');
  const [token, setToken] = useState(storedContext.token);
  const [user, setUser] = useState(storedContext.user);
  const [error, setError] = useState<ErrorData>({
    open: false,
    severity: 'error',
    message: 'test',
  });
  const [loginRedirectUrl, setLoginRedirectUrl] = useState(
    storedContext.loginRedirectUrl,
  );
  const api = new MoneyBalancerApi({ token, setToken, setError });

  useEffect(() => {
    localStorage.setItem(
      'de.itsblue.money-balancer.context',
      JSON.stringify({
        token: token,
        loginRedirectUrl: loginRedirectUrl,
        user: user,
      }),
    );
  }, [token, loginRedirectUrl, user]);

  return (
    <Context.Provider
      value={{
        title,
        setTitle,
        token,
        user,
        setUser,
        error,
        setError,
        loginRedirectUrl,
        setLoginRedirectUrl,
        api,
      }}
    >
      {children}
    </Context.Provider>
  );
}
