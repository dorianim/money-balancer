import { Button, CircularProgress, Modal, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import CollapsableAlert from '../components/CollapsableAlert';
import { Context } from '../data/Context';

export default function GroupJoinPage() {
  const { groupId } = useParams();
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
    setTitle('Join group');
    setGoBackToUrl('/');
  });

  const joinGroup = async () => {
    setLoading(true);
    const r = await api.joinGroup(groupId ?? '');
    setLoading(false);
    if (!r) {
      return;
    }

    navigate(`/group/${groupId}`);
  };

  if (!api.loggedIn()) {
    return <></>;
  }

  return (
    <>
      <CollapsableAlert sx={{ marginBottom: 2 }}></CollapsableAlert>

      <Typography variant='h4' sx={{ marginBottom: 2 }}>
        You have been invited to join a group
      </Typography>
      <Button variant='contained' onClick={joinGroup} disabled={loading}>
        Join group
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
