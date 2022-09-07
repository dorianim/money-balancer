import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  ListItemText,
  MenuItem,
  Modal,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Context } from '../data/Context';
import { Balance, UserBalances } from '../data/Types';
import CollapsableAlert from '../components/CollapsableAlert';
import { Add } from '@mui/icons-material';
import { FieldValues, useForm } from 'react-hook-form';
import { LoadingButton } from '@mui/lab';

export default function LoginPage() {
  const { balanceId } = useParams();

  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { setTitle, user, setLoginRedirectUrl, api } = useContext(Context);

  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [balanceData, setBalanceData] = useState<Balance>();
  const [balancesWithOtherUsers, setBalancesWithOtherUsers] =
    useState<UserBalances>({});
  const [selectedConsumers, setSelectedConsumers] = useState<string[]>([]);

  useEffect(() => {
    setTitle('');
    if (!api.loggedIn()) {
      setLoginRedirectUrl(location.pathname);
      navigate('/login');
      return;
    }

    loadBalanceData();
  }, [balanceId]);

  const loadBalanceData = async () => {
    setLoading(true);
    const r = await api.getBalance(balanceId ?? '');
    setLoading(false);

    if (r === 'unauthorized') {
      navigate(`/join-balance/${balanceId}`);
      return;
    }
    if (r === undefined) {
      navigate('/');
      return;
    }

    setBalanceData(r);
    setBalancesWithOtherUsers(calculateBalancesWithOtherUsers(r));
    setTitle(r.name);
  };

  const calculateBalancesWithOtherUsers = (balance: Balance) => {
    const tmpBalancesWithOtherUsers: UserBalances = {};
    for (const otherUserId of Object.keys(balance?.users || {})) {
      if (otherUserId === user?.id) continue;

      const userBalanceKey = [user?.id, otherUserId].sort().join(':');
      const userBalance = balance?.userBalances[userBalanceKey] || 0;

      if ((user?.id || '') < otherUserId) {
        tmpBalancesWithOtherUsers[otherUserId] = userBalance;
      } else {
        tmpBalancesWithOtherUsers[otherUserId] = -userBalance;
      }
    }

    return tmpBalancesWithOtherUsers;
  };

  const onSubmit = async (data: FieldValues) => {
    setLoading(true);
    const r = await api.createPurchase(
      balanceId ?? '',
      parseFloat(data.amount) * 100,
      data.description,
      selectedConsumers,
    );
    setLoading(false);

    if (!r) {
      return;
    }

    setDialogOpen(false);
    loadBalanceData();
  };

  const onConsumersChange = (e: SelectChangeEvent<string[]>) => {
    const value =
      typeof e.target.value === 'string'
        ? e.target.value.split(',')
        : e.target.value;
    setSelectedConsumers(value);
  };

  if (!api.loggedIn()) {
    return <></>;
  }

  return (
    <>
      <Typography variant='h5' sx={{ paddingBottom: 2 }}>
        Balance {balanceData?.name}, owner:{' '}
        {balanceData?.users[balanceData.owner].nickname}
      </Typography>

      <Grid container spacing={2}>
        {Object.keys(balancesWithOtherUsers).map(otherUserId => (
          <Grid key={`current-balance-with-${otherUserId}`} xs='auto' item>
            <Chip
              label={
                balancesWithOtherUsers[otherUserId] === 0
                  ? `You are even with ${balanceData?.users[otherUserId].nickname}`
                  : balancesWithOtherUsers[otherUserId] < 0
                  ? `You owe ${balanceData?.users[otherUserId].nickname} ${
                      balancesWithOtherUsers[otherUserId] / 100
                    }€`
                  : `${balanceData?.users[otherUserId].nickname} ows you ${
                      balancesWithOtherUsers[otherUserId] / 100
                    }€`
              }
              color={
                balancesWithOtherUsers[otherUserId] < 0 ? 'error' : 'success'
              }
            />
          </Grid>
        ))}
      </Grid>

      <Typography variant='h5' sx={{ paddingBottom: 2, paddingTop: 2 }}>
        Purchases
      </Typography>

      <Grid spacing={2} container>
        <Grid item xs={12}>
          <Button
            variant='outlined'
            onClick={() => setDialogOpen(true)}
            fullWidth
          >
            <Add sx={{ marginRight: 1 }}></Add>
            New purchase
          </Button>
        </Grid>

        {balanceData?.purchases.map(purchase => (
          <Grid
            item
            xs={12}
            key={`purchase-${purchase.timestamp}-${purchase.amount}-${
              purchase.purchaser
            }-${purchase.consumers.join('-')}`}
          >
            <Card>
              <CardContent>
                <Grid container spacing={2} alignItems='center'>
                  <Grid item>
                    <Chip
                      label={(purchase.amount / 100).toFixed(2) + '€'}
                      color={
                        purchase.purchaser === user?.id
                          ? 'success'
                          : purchase.consumers.indexOf(user?.id ?? '') >= 0
                          ? 'error'
                          : 'info'
                      }
                    ></Chip>
                  </Grid>
                  <Grid item>
                    <Typography variant='h6'>{purchase.description}</Typography>
                  </Grid>

                  <Grid item>
                    <Typography variant='body2'>
                      {new Date(purchase.timestamp).toLocaleString()}
                    </Typography>
                  </Grid>

                  <Grid item>
                    <Typography variant='body2'>
                      Purchased by{' '}
                      <b>
                        {purchase.purchaser === user?.id
                          ? 'you'
                          : balanceData?.users[purchase.purchaser].nickname}
                      </b>{' '}
                      for{' '}
                      {purchase.consumers
                        .map(consumerId =>
                          consumerId === user?.id
                            ? 'yourself'
                            : balanceData?.users[consumerId].nickname,
                        )
                        .reduce(
                          (text, value, i, array) =>
                            text +
                            (i < array.length - 1 ? ', ' : ' and ') +
                            value,
                        )}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>New balance</DialogTitle>

        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <CollapsableAlert sx={{ marginBottom: 2 }}></CollapsableAlert>

            <DialogContentText>
              To create a new purchase, please enter the amount, who uses it and
              a description for it.
            </DialogContentText>
            <TextField
              label='Amount (in €)'
              inputProps={{
                inputMode: 'numeric',
              }}
              helperText='Euros and cents in the format separated by a dot'
              disabled={loading}
              error={errors.amount !== undefined}
              {...register('amount', {
                required: true,
                pattern: /[0-9]*(.[0-9][0-9]|)/,
              })}
              sx={{ marginTop: 2 }}
              fullWidth
              autoFocus
            />

            <TextField
              label='Description'
              disabled={loading}
              error={errors.description !== undefined}
              {...register('description', { required: true })}
              sx={{ marginTop: 2 }}
              fullWidth
            />

            <FormControl sx={{ marginTop: 2 }} fullWidth>
              <InputLabel id='consumers-checkbox-label'>Consumers</InputLabel>
              <Select
                multiple
                labelId='consumers-checkbox-label'
                id='consumers-checkbox'
                name='consumers'
                value={selectedConsumers}
                onChange={e => onConsumersChange(e)}
                input={<OutlinedInput id='select-multiple-chip' label='Chip' />}
                disabled={loading}
                error={errors.consumers !== undefined}
                required
                renderValue={selected => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map(value => (
                      <Chip
                        key={`dialog-consumer-chip-${value}`}
                        label={balanceData?.users[value].nickname}
                      />
                    ))}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 48 * 4.5 + 8,
                      width: 250,
                    },
                  },
                }}
              >
                {Object.values(balanceData?.users || {}).map(user => (
                  <MenuItem
                    key={`dialog-consumer-menu-item-${user.id}`}
                    value={user.id}
                  >
                    <Checkbox
                      checked={selectedConsumers.indexOf(user.id) > -1}
                    />
                    <ListItemText primary={user.nickname} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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

      <Modal
        open={loading && !dialogOpen}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <CircularProgress></CircularProgress>
      </Modal>
    </>
  );
}
