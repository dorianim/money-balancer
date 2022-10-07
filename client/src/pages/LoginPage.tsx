import { Button, Divider, Grid, Skeleton } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { Context } from '../data/Context';
import { useNavigate } from 'react-router-dom';
import CollapsableAlert from '../components/CollapsableAlert';
import { FieldValues } from 'react-hook-form';
import { AvailableAuthenticationProviders } from '../data/Types';
import LoginForm from '../components/LoginForm';

export default function LoginPage() {
  const { setTitle, setGoBackToUrl, loginRedirectUrl, setUser, api } =
    useContext(Context);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [availableProviders, setAvailableProviders] =
    useState<AvailableAuthenticationProviders>();

  useEffect(() => {
    if (api.loggedIn()) {
      navigate('/');
      return;
    }

    setTitle('Login');
    setGoBackToUrl(undefined);
    loadAvailableProviders();
  }, []);

  const loadAvailableProviders = async () => {
    const availableProviders = await api.getAvailableAuthenticationProviders();
    setAvailableProviders(availableProviders);

    if (
      !availableProviders?.local.enabled &&
      availableProviders?.proxy.enabled
    ) {
      loginUsingProxy();
    }
  };

  const loginUsingLocal = async (data: FieldValues) => {
    setLoading(true);
    const loginResult = await api.localLogin(data.username, data.password);
    if (!loginResult) {
      setLoading(false);
      return;
    }

    const userData = await api.getUser();
    if (!userData) {
      api.logout();
      setLoading(false);
      return;
    }

    setUser(userData);

    setLoading(false);
    navigate(loginRedirectUrl, { replace: true });
  };

  const loginUsingProxy = () => {
    api.proxyRedirect();
  };

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <CollapsableAlert></CollapsableAlert>
        </Grid>

        {availableProviders?.local.enabled && (
          <Grid item xs={12}>
            <LoginForm onSubmit={loginUsingLocal} loading={loading} />
          </Grid>
        )}

        {availableProviders?.local.enabled &&
          availableProviders?.proxy.enabled && (
            <Grid item xs={12}>
              <Divider>Or</Divider>
            </Grid>
          )}

        {availableProviders?.proxy.enabled && (
          <Grid item xs={12}>
            <Button
              variant='contained'
              disabled={loading}
              onClick={loginUsingProxy}
              fullWidth
            >
              Login using SSO
            </Button>
          </Grid>
        )}

        {!availableProviders && (
          <Grid item xs={12}>
            <Skeleton height={52.5}></Skeleton>
            <Skeleton height={52.5}></Skeleton>
            <Skeleton height={52.5}></Skeleton>
          </Grid>
        )}

        {availableProviders?.local.enabled && (
          <>
            <Grid item xs={12}>
              <Divider>Or</Divider>
            </Grid>

            <Grid item xs={12}>
              <Button
                disabled={loading}
                variant='outlined'
                onClick={() => navigate('/registration')}
                fullWidth
              >
                Register
              </Button>
            </Grid>
          </>
        )}
      </Grid>
    </>
  );
}
