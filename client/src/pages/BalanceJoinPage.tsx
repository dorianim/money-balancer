import { Button, CircularProgress, Modal, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import CollapsableAlert from '../components/CollapsableAlert';
import { Context } from '../data/Context';
import { URL } from '../data/MoneyBalancerApi';

export default function BalanceJoinPage() {
  const { balanceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, setTitle, error, setError, setLoginRedirectUrl } =
    useContext(Context);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token === '') {
      setLoginRedirectUrl(location.pathname);
      navigate('/login');
      return;
    }
    setTitle('Join balance');
  });

  const joinBalance = async () => {
    setLoading(true);
    const r = await fetch(`${URL}/balance/${balanceId}`, {
      method: 'POST',
      headers: new Headers({ Authorization: 'Bearer ' + token }),
    });
    setLoading(false);

    if (r.status !== 200) {
      const data = await r.json();
      setError({ severity: 'error', message: data.message, open: true });
      return;
    }

    setError({ ...error, open: false });
    navigate(`/balance/${balanceId}`);
  };

  if (token === '') {
    return <></>;
  }

  return (
    <>
      <CollapsableAlert sx={{ marginBottom: 2 }}></CollapsableAlert>

      <Typography variant='h4' sx={{ marginBottom: 2 }}>
        You have been invited to join a balance
      </Typography>
      <Button variant='contained' onClick={joinBalance} disabled={loading}>
        Join balance
      </Button>

      <Modal
        open={loading}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <CircularProgress></CircularProgress>
      </Modal>
    </>
  );
}
