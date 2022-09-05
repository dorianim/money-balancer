import {
  Alert,
  AlertColor,
  Collapse,
  Grid,
  IconButton,
  TextField,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useContext, useEffect, useRef, useState } from 'react';
import { Context } from '../data/Context';
import CloseIcon from '@mui/icons-material/Close';
import { URL } from '../data/MoneyBalancerApi';
import { User } from '../data/Types';
import { useNavigate } from 'react-router-dom';
import CollapsableAlert from '../components/CollapsableAlert';

export default function LoginPage() {
  const {
    token,
    setTitle,
    setToken,
    error,
    setError,
    loginRedirectUrl,
    setUser,
  } = useContext(Context);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const username = useRef<string>();
  const password = useRef<string>();

  if (token !== '') {
    navigate('/');
  }

  useEffect(() => setTitle('Login'), []);

  const login = async () => {
    setLoading(true);
    let r = await fetch(URL + '/user/token', {
      method: 'POST',
      body: JSON.stringify({
        username: username.current,
        password: password.current,
      }),
    });
    setLoading(false);

    if (r.status !== 200) {
      const data = await r.json();
      setError({ severity: 'error', message: data.message, open: true });

      return;
    }

    const data = await r.json();
    setError({ ...error, open: false });
    setToken(data.token);

    r = await fetch(URL + '/user', {
      method: 'GET',
      headers: new Headers({ Authorization: 'Bearer ' + data.token }),
    });

    if (r.status !== 200) {
      setToken('');
      const data = await r.json();
      setError({ severity: 'error', message: data.message, open: true });
      return;
    }

    const user: User = await r.json();
    setUser(user);

    setError({ ...error, open: false });
    navigate(loginRedirectUrl);
  };

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <CollapsableAlert></CollapsableAlert>
        </Grid>
        <Grid item xs={12}>
          <TextField
            label='username'
            onChange={e => (username.current = e.target.value)}
            disabled={loading}
            fullWidth
          ></TextField>
        </Grid>

        <Grid item xs={12}>
          <TextField
            type={'password'}
            label='password'
            onChange={e => (password.current = e.target.value)}
            disabled={loading}
            fullWidth
          ></TextField>
        </Grid>

        <Grid item xs={12}>
          <LoadingButton
            loading={loading}
            variant='contained'
            onClick={login}
            fullWidth
          >
            Login
          </LoadingButton>
        </Grid>
      </Grid>
    </>
  );
}
