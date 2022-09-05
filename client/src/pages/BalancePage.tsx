import {
  Box,
  Button,
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
import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Context } from '../data/Context';
import { Balance } from '../data/Types';
import { URL } from '../data/MoneyBalancerApi';
import CollapsableAlert from '../components/CollapsableAlert';
import { Add } from '@mui/icons-material';

export default function LoginPage() {
  const { balanceId } = useParams();

  const navigate = useNavigate();
  const location = useLocation();
  const {
    token,
    setTitle,
    setToken,
    user,
    setUser,
    error,
    setError,
    setLoginRedirectUrl,
  } = useContext(Context);

  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [balanceData, setBalanceData] = useState<Balance>();
  const [formFieldErrors, setFormFieldErrors] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedConsumers, setSelectedConsumers] = useState<string[]>([]);

  const balancesWithOtherUsers: { [otherUserId: string]: number } = {};
  for (const otherUserId of Object.keys(balanceData?.users || {})) {
    if (otherUserId === user?.id) continue;

    console.log(otherUserId, user?.id);

    const userBalanceKey = [user?.id, otherUserId].sort().join(':');
    const userBalance = balanceData?.userBalances[userBalanceKey] || 0;

    if ((user?.id || '') < otherUserId) {
      balancesWithOtherUsers[otherUserId] = userBalance;
    } else {
      balancesWithOtherUsers[otherUserId] = -userBalance;
    }
  }

  useEffect(() => {
    setTitle('');
    if (token === '') {
      setLoginRedirectUrl(location.pathname);
      navigate('/login');
    } else {
      loadBalanceData();
    }
  }, [balanceId]);

  const loadBalanceData = async () => {
    const r = await fetch(URL + `/balance/${balanceId}`, {
      method: 'GET',
      headers: new Headers({ Authorization: 'Bearer ' + token }),
    });
    setLoading(false);

    if (r.status === 403) {
      navigate(`/join-balance/${balanceId}`);
      return;
    } else if (r.status !== 200) {
      navigate('/');
      return;
    }

    const balanceData: Balance = await r.json();
    console.log(balanceData);

    setBalanceData(balanceData);
    setTitle(balanceData.name);
  };

  const createPurchase = async (event: React.FormEvent<HTMLFormElement>) => {
    setDialogOpen(false);
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const r = await fetch(URL + `/balance/${balanceId}/purchase`, {
      method: 'POST',
      headers: new Headers({ Authorization: 'Bearer ' + token }),
      body: JSON.stringify({
        amount: parseFloat(formData.get('amount')?.toString() || '') * 100,
        description: formData.get('description'),
        consumers: selectedConsumers,
      }),
    });

    if (r.status !== 200) {
      const data = await r.json();
      setError({ severity: 'error', message: data.message, open: true });
      setLoading(false);
      return;
    }

    loadBalanceData();
  };

  const onChange = (
    e?: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    if (e === undefined) return;

    setFormFieldErrors({
      ...formFieldErrors,
      [e.target.name]: !e.target?.validity.valid,
    });
  };

  const onConsumersChange = (e: SelectChangeEvent<string[]>) => {
    const value =
      typeof e.target.value === 'string'
        ? e.target.value.split(',')
        : e.target.value;
    setSelectedConsumers(value);
  };

  if (token === '') {
    return <></>;
  }

  return (
    <>
      <CollapsableAlert sx={{ marginBottom: 2 }}></CollapsableAlert>

      <Typography variant='h5' sx={{ paddingBottom: 2 }}>
        Balance {balanceData?.name}, owner:{' '}
        {balanceData?.users[balanceData.owner].nickname}
      </Typography>

      <Grid container spacing={2}>
        {Object.keys(balancesWithOtherUsers).map(otherUserId => (
          <Grid key={`current-balance-with-${otherUserId}`} xs={12} item>
            <Chip
              label={`Current balance with ${
                balanceData?.users[otherUserId].nickname
              }: ${balancesWithOtherUsers[otherUserId] / 100}€`}
              color={
                balancesWithOtherUsers[otherUserId] < 0 ? 'error' : 'success'
              }
            />
          </Grid>
        ))}
      </Grid>

      <Typography variant='h5' sx={{ paddingBottom: 2 }}>
        Purchases
      </Typography>

      <Grid spacing={2} container>
        {balanceData?.purchases.map(purchase => (
          <Grid
            item
            xs={12}
            key={`purchase-${purchase.timestamp}-${purchase.amount}-${
              purchase.purchaser
            }-${purchase.consumers.join('-')}`}
          >
            <Typography variant='h6'>{purchase.description}</Typography>
            by {balanceData.users[purchase.purchaser].nickname} for{' '}
            {purchase.amount / 100}€ on{' '}
            {new Date(purchase.timestamp).toLocaleString()} to{' '}
            {purchase.consumers
              .map(consumer => balanceData.users[consumer].nickname)
              .join(', ')}
          </Grid>
        ))}

        <Grid item xs={12}>
          <Button variant='outlined' onClick={() => setDialogOpen(true)}>
            <Add sx={{ marginRight: 1 }}></Add>
            New purchase
          </Button>
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>New balance</DialogTitle>

        <form
          onSubmit={e => {
            e.preventDefault();
            createPurchase(e);
          }}
        >
          <DialogContent>
            <DialogContentText>
              To create a new purchase, please enter the amount, who uses it and
              a description for it.
            </DialogContentText>
            <TextField
              name='amount'
              label='amount (in €)'
              error={formFieldErrors['amount'] || false}
              variant='standard'
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*(.[0-9][0-9]|)',
              }}
              helperText='Euros and cents in the format separated by a dot'
              required
              onChange={onChange}
              fullWidth
            />
            <TextField
              sx={{ marginTop: 2 }}
              autoFocus
              margin='dense'
              name='description'
              label='Description'
              fullWidth
              variant='standard'
              onChange={onChange}
              required
            />

            <FormControl sx={{ marginTop: 2 }} fullWidth required>
              <InputLabel id='consumers-checkbox-label'>Consumers</InputLabel>
              <Select
                multiple
                labelId='consumers-checkbox-label'
                id='consumers-checkbox'
                name='consumers'
                value={selectedConsumers}
                onChange={(e, _) => onConsumersChange(e)}
                input={<OutlinedInput id='select-multiple-chip' label='Chip' />}
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
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type='submit'>Create</Button>
          </DialogActions>
        </form>
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
