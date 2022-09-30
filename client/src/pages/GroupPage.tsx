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
import { Debt, GroupMember, Transaction } from '../data/Types';
import CollapsableAlert from '../components/CollapsableAlert';
import { FieldValues, useForm } from 'react-hook-form';
import { LoadingButton } from '@mui/lab';
import Debts from '../components/Debts';
import TransactionHistory from '../components/TransactionHistory';

export default function LoginPage() {
  const { groupId } = useParams();

  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { setTitle, setGoBackToUrl, user, setLoginRedirectUrl, api } =
    useContext(Context);

  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupMembers, setGroupMembers] =
    useState<Record<string, GroupMember>>();
  const [debts, setDebts] = useState<Debt[]>();
  const [transactions, setTransactions] = useState<Transaction[]>();
  const [selectedConsumers, setSelectedConsumers] = useState<string[]>([]);

  useEffect(() => {
    setTitle('');

    if (!api.loggedIn()) {
      setLoginRedirectUrl(location.pathname);
      navigate('/login');
      return;
    }

    setGoBackToUrl('/');
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    // first, load group data, as it is required for later
    setGroupMembers(undefined);
    const r = await api.getGroup(groupId ?? '');

    if (r === 'unauthorized') {
      navigate(`/join-group/${groupId}`);
      return;
    }
    if (r === undefined) {
      navigate('/');
      return;
    }

    setGroupMembers(
      r.members.reduce(
        (acc, member) => ({
          ...acc,
          [member.id]: member,
        }),
        {} as Record<string, GroupMember>,
      ),
    );
    setTitle(r.name);

    // then, load debts and transactions in parallel
    loadDebts();
    loadTransactions();
  };

  const loadDebts = async () => {
    setDebts(undefined);
    const r = await api.getDebtsOfGroup(groupId ?? '');

    if (r === undefined) {
      navigate('/');
      return;
    }

    setDebts(r);
  };

  const loadTransactions = async () => {
    setTransactions(undefined);
    const r = await api.getTransactionsOfGroup(groupId ?? '');

    if (r === undefined) {
      navigate('/');
      return;
    }

    setTransactions(r);
  };

  const onSubmit = async (data: FieldValues) => {
    setLoading(true);
    const r = await api.createTransaction(
      groupId ?? '',
      parseFloat(data.amount) * 100,
      data.description,
      selectedConsumers,
    );
    setLoading(false);

    if (!r) {
      return;
    }

    setDialogOpen(false);
    loadGroupData();
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
        Your debts
      </Typography>

      {debts && groupMembers ? (
        <Debts groupMembersById={groupMembers} debts={debts}></Debts>
      ) : (
        <Grid container spacing={2}>
          {new Array(2).fill(0).map((_, i) => (
            <Grid item xs='auto' key={`current-group-skeleton-${i}`}>
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
        Transaction history
      </Typography>

      {transactions && groupMembers ? (
        <TransactionHistory
          transactions={transactions.sort((a, b) => {
            return b.timestamp - a.timestamp;
          })}
          groupMembersById={groupMembers}
          currentUserId={user?.id ?? ''}
          onCreateNewTransaction={() => setDialogOpen(true)}
        ></TransactionHistory>
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
        <DialogTitle>New transaction</DialogTitle>

        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <CollapsableAlert sx={{ marginBottom: 2 }}></CollapsableAlert>

            <DialogContentText>
              To create a new transaction, please enter the amount, who uses it
              and a description for it.
            </DialogContentText>
            <TextField
              label='Amount (in €)'
              inputProps={{
                inputMode: 'numeric',
                step: '0.01',
              }}
              helperText={errors.amount && 'must be greater than 0'}
              disabled={loading}
              error={errors.amount !== undefined}
              defaultValue={'0.00'}
              {...register('amount', {
                required: true,
                pattern: /.*[1-9].*/,
                onChange: e => {
                  e.target.value = e.target.value.replace(',', '.');
                  let amount: string = e.target.value.replace(/[^0-9]/g, '');

                  while (amount.length < 3) {
                    amount = '0' + amount;
                  }

                  amount =
                    amount.substring(0, amount.length - 2) +
                    '.' +
                    amount.substring(amount.length - 2);

                  while (amount[0] === '0' && amount.length > 4) {
                    amount = amount.substring(1);
                  }

                  e.target.value = amount;
                },
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
                        label={groupMembers?.[value].nickname}
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
                {Object.values(groupMembers || {}).map(user => (
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
