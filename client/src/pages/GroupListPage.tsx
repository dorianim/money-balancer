import { Add, ChevronRight } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import CollapsableAlert from '../components/CollapsableAlert';

import { Context } from '../data/Context';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { api, setTitle, setGoBackToUrl, user, setUser, setLoginRedirectUrl } =
    useContext(Context);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!api.loggedIn()) {
      setLoginRedirectUrl(location.pathname);
      navigate('/login');
      return;
    }

    setTitle('My groups');
    setGoBackToUrl(undefined);
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    const r = await api.getUser();
    setLoading(false);

    if (!r) {
      api.logout();
      navigate('/login');
      return;
    }

    setUser(r);
  };

  const onSubmit = async (data: FieldValues) => {
    setLoading(true);
    const r = await api.createGroup(data.name);
    setLoading(false);

    if (!r) {
      return;
    }

    setDialogOpen(false);
    loadUserData();
  };

  if (!api.loggedIn()) {
    return <></>;
  }

  return (
    <>
      <Typography variant='h5' sx={{ paddingBottom: 2 }}>
        Hello, {user?.nickname}
      </Typography>

      <Grid spacing={2} container>
        {!loading
          ? user?.groups.map(group => (
              <Grid xs={12} key={`group-item-${group.id}`} item>
                <Button
                  onClick={() => navigate(`/group/${group.id}`)}
                  variant='contained'
                  endIcon={<ChevronRight />}
                  fullWidth
                >
                  {group.name}
                </Button>
              </Grid>
            ))
          : new Array(2).fill(0).map((_, i) => (
              <Grid item xs={12} key={`current-group-skeleton-${i}`}>
                <Skeleton variant='rounded' width={'100%'} height={36.5} />
              </Grid>
            ))}

        <Grid item xs={12}>
          <Button
            variant='outlined'
            onClick={() => setDialogOpen(true)}
            disabled={loading}
          >
            <Add sx={{ marginRight: 1 }}></Add>
            New group
          </Button>
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>New group</DialogTitle>

        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <CollapsableAlert sx={{ marginBottom: 2 }}></CollapsableAlert>

            <DialogContentText>
              To create a new group, please enter a name for it. You can then
              invite users to join via a link.
            </DialogContentText>
            <TextField
              label='Name'
              disabled={loading}
              error={errors.name !== undefined}
              {...register('name', { required: true })}
              sx={{ marginTop: 2 }}
              fullWidth
              autoFocus
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <LoadingButton loading={loading} type='submit'>
              Create
            </LoadingButton>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
