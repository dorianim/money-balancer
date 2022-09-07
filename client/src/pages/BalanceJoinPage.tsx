import { Button, CircularProgress, Modal, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import CollapsableAlert from '../components/CollapsableAlert';
import { Context } from '../data/Context';

export default function BalanceJoinPage() {
  const { balanceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { api, setTitle, setGoBackToUrl, setLoginRedirectUrl } =
    useContext(Context);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!api.loggedIn()) {
      setLoginRedirectUrl(location.pathname);
      navigate('/login');
      return;
    }
    setTitle('Join balance');
    setGoBackToUrl('/');
  });

  const joinBalance = async () => {
    setLoading(true);
    const r = await api.joinBalance(balanceId ?? '');
    setLoading(false);
    if (!r) {
      return;
    }

    navigate(`/balance/${balanceId}`);
  };

  if (!api.loggedIn()) {
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
