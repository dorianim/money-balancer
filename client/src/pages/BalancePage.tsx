import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
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
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Context } from '../data/Context';
import { Balance, UserBalances } from '../data/Types';
import CollapsableAlert from '../components/CollapsableAlert';
import { FieldValues, useForm } from 'react-hook-form';
import { LoadingButton } from '@mui/lab';
import BalancesWithOtherUsers from '../components/BalancesWithOtherUsers';
import PurchaseHistory from '../components/PurchaseHistory';

export default function LoginPage() {
  const { balanceId } = useParams();

  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { setTitle, setGoBackToUrl, user, setLoginRedirectUrl, api } =
    useContext(Context);

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

    setGoBackToUrl('/');
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
        Your balances
      </Typography>

      {!loading ? (
        <BalancesWithOtherUsers
          users={balanceData?.users ?? {}}
          balancesWithOtherUsers={balancesWithOtherUsers}
        ></BalancesWithOtherUsers>
      ) : (
        <Grid container spacing={2}>
          {new Array(2).fill(0).map((_, i) => (
            <Grid item xs='auto' key={`current-balance-skeleton-${i}`}>
              <Skeleton
                variant='rounded'
                width={120}
                height={32}
                sx={{ borderRadius: '16px' }}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Typography variant='h5' sx={{ paddingBottom: 2, paddingTop: 2 }}>
        Purchase history
      </Typography>

      {!loading ? (
        <PurchaseHistory
          purchases={(balanceData?.purchases ?? []).sort((a, b) => {
            return b.timestamp - a.timestamp;
          })}
          users={balanceData?.users ?? {}}
          currentUserId={user?.id ?? ''}
          onCreateNewPurchase={() => setDialogOpen(true)}
        ></PurchaseHistory>
      ) : (
        <Grid spacing={2} container>
          <Grid item xs={12}>
            <Skeleton variant='rectangular' height={36.5} width='100%' />
          </Grid>

          {new Array(10).fill(0).map((_, i) => (
            <Grid item xs={12} key={i}>
              <Card>
                <CardContent>
                  <Grid container spacing={2} alignItems='center'>
                    <Grid item>
                      <Skeleton
                        variant='rounded'
                        width={60}
                        height={32}
                        sx={{ borderRadius: '16px' }}
                      />
                    </Grid>

                    <Grid item>
                      <Skeleton
                        variant='text'
                        sx={{ fontSize: '1.25rem' }}
                        width={80}
                      />
                    </Grid>

                    <Grid item>
                      <Skeleton
                        variant='text'
                        sx={{ fontSize: '0.875rem' }}
                        width={140}
                      />
                    </Grid>

                    <Grid item>
                      <Skeleton
                        variant='text'
                        sx={{ fontSize: '1rem' }}
                        width={200}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

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
    </>
  );
}
