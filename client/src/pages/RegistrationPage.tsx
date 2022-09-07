import { Grid, TextField } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useContext, useEffect, useState } from 'react';
import { Context } from '../data/Context';
import { useNavigate } from 'react-router-dom';
import CollapsableAlert from '../components/CollapsableAlert';
import { FieldValues, useForm } from 'react-hook-form';

export default function RegistrationPage() {
  const { setTitle, setGoBackToUrl, setUser, api, loginRedirectUrl } =
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
    }

    setTitle('Register');
    setGoBackToUrl('/login');
  }, []);

  const onSubmit = async (data: FieldValues) => {
    setLoading(true);
    const registerResult = await api.createUser(
      data.username,
      data.nickname,
      data.password,
    );

    if (!registerResult) {
      setLoading(false);
      return;
    }

    const loginResult = await api.login(data.username, data.password);
    if (!loginResult) {
      setLoading(false);
      navigate('/login');
      return;
    }

    const userData = await api.getUser();
    if (!userData) {
      api.logout();
      setLoading(false);
      navigate('/login');
      return;
    }

    setLoading(false);
    setUser(userData);
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
              helperText='The name you use to sign in'
              disabled={loading}
              error={errors.username !== undefined}
              {...register('username', { required: true })}
              fullWidth
            ></TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label='Nickname'
              helperText='Your name as it appears to others'
              disabled={loading}
              error={errors.nickname !== undefined}
              {...register('nickname', { required: true })}
              fullWidth
            ></TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              type='password'
              label='Password'
              disabled={loading}
              error={errors.password !== undefined}
              {...register('password', { required: true, minLength: 8 })}
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
              Register
            </LoadingButton>
          </Grid>
        </Grid>
      </form>
    </>
  );
}
