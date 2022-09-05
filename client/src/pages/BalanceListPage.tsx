import { Add } from '@mui/icons-material';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Modal,
  TextField,
  Typography,
} from '@mui/material';
import { useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CollapsableAlert from '../components/CollapsableAlert';

import { Context } from '../data/Context';
import { URL } from '../data/MoneyBalancerApi';
import { User } from '../data/Types';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, setTitle, user, setUser, setError, setLoginRedirectUrl, api } =
    useContext(Context);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const newBalanceName = useRef('');

  useEffect(() => {
    setTitle('My balances');
    if (token === '') {
      setLoginRedirectUrl(location.pathname);
      navigate('/login');
    } else {
      loadUserData();
    }
  }, [token]);

  const loadUserData = async () => {
    setLoading(true);
    const r = await fetch(URL + '/user', {
      method: 'GET',
      headers: new Headers({ Authorization: 'Bearer ' + token }),
    });
    setLoading(false);

    if (r.status !== 200) {
      api.logout();
      return;
    }

    const user: User = await r.json();
    console.log(user);

    setUser(user);
  };

  const createBalance = async () => {
    setDialogOpen(false);
    setLoading(true);
    const r = await fetch(URL + '/balance', {
      method: 'POST',
      headers: new Headers({ Authorization: 'Bearer ' + token }),
      body: JSON.stringify({ name: newBalanceName.current }),
    });

    if (r.status !== 200) {
      const data = await r.json();
      setError({ severity: 'error', message: data.message, open: true });
      setLoading(false);
      return;
    }

    loadUserData();
  };

  if (token === '') {
    setLoginRedirectUrl(location.pathname);
    navigate('/login');
    return <></>;
  }

  return (
    <>
      <CollapsableAlert sx={{ marginBottom: 2 }}></CollapsableAlert>

      <Typography variant='h5' sx={{ paddingBottom: 2 }}>
        Hello, {user?.nickname}
      </Typography>

      <Grid spacing={2} container>
        {Object.keys(user?.balances || {}).map(balanceId => (
          <Grid xs={12} key={`balance-item-${balanceId}`} item>
            <Button
              onClick={() => navigate(`/balance/${balanceId}`)}
              variant='contained'
            >
              {user?.balances[balanceId].name}
            </Button>
          </Grid>
        ))}

        <Grid item xs={12}>
          <Button variant='outlined' onClick={() => setDialogOpen(true)}>
            <Add sx={{ marginRight: 1 }}></Add>
            New balance
          </Button>
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>New balance</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To create a new balance, please enter a name for it. You can then
            invite users to join via a link.
          </DialogContentText>
          <TextField
            autoFocus
            margin='dense'
            id='name'
            label='Name'
            fullWidth
            variant='standard'
            onChange={e => (newBalanceName.current = e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={createBalance}>Create</Button>
        </DialogActions>
      </Dialog>

      <Modal
        open={loading}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <CircularProgress></CircularProgress>
      </Modal>
    </>
  );
}
