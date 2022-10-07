import { LoadingButton } from '@mui/lab';
import { Grid, TextField } from '@mui/material';
import { FieldValues, useForm } from 'react-hook-form';

export default function LoginForm(props: {
  onSubmit: (data: FieldValues) => void;
  loading: boolean;
}) {
  const { onSubmit, loading } = props;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
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
      </Grid>
    </form>
  );
}
