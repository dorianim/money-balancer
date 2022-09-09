import { Button, Grid, TextField } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useContext, useEffect, useState } from 'react';
import { Context } from '../data/Context';
import { useNavigate } from 'react-router-dom';
import CollapsableAlert from '../components/CollapsableAlert';
import { FieldValues, useForm } from 'react-hook-form';

export default function LoginPage() {
  const { setTitle, setGoBackToUrl, loginRedirectUrl, setUser, api } =
    useContext(Context);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (api.loggedIn()) {
      navigate('/');
      return;
    }

    setTitle('Login');
    setGoBackToUrl(undefined);
  }, []);

  const onSubmit = async (data: FieldValues) => {
    setLoading(true);
    const loginResult = await api.login(data.username, data.password);
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

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <CollapsableAlert></CollapsableAlert>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label='Username'
              disabled={loading}
              error={errors.username !== undefined}
              {...register('username', { required: true })}
              fullWidth
            ></TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              type={'password'}
              label='Password'
              disabled={loading}
              error={errors.password !== undefined}
              {...register('password', { required: true })}
              fullWidth
            ></TextField>
          </Grid>

          <Grid item xs={12}>
            <LoadingButton
              loading={loading}
              variant='contained'
              type='submit'
              fullWidth
            >
              Login
            </LoadingButton>
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
        </Grid>
      </form>
    </>
  );
}
