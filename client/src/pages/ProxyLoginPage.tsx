import { CircularProgress, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Context } from '../data/Context';

export default function ProxyLoginPage() {
  const { setTitle, setGoBackToUrl, loginRedirectUrl, api } =
    useContext(Context);
  const navigate = useNavigate();

  useEffect(() => {
    if (api.loggedIn()) {
      navigate('/');
      return;
    }

    setTitle('Proxy login ...');
    setGoBackToUrl(undefined);

    proxyLogin();
  }, []);

  const proxyLogin = async () => {
    const loginResult = await api.proxyLogin();

    if (!loginResult) {
      navigate('/login');
      return;
    }

    const userData = await api.getUser();
    if (!userData) {
      navigate('/login');
      return;
    }

    navigate(loginRedirectUrl, { replace: true });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '80vh',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress></CircularProgress>
        <Typography>Logging you in...</Typography>
      </Box>
    </Box>
  );
}
