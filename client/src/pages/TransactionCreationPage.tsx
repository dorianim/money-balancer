import { LoadingButton } from '@mui/lab';
import { Grid, Skeleton, TextField, Typography } from '@mui/material';
import { useContext, useEffect, useRef, useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import CollapsableAlert from '../components/CollapsableAlert';
import MoneyTextField from '../components/MoneyTextField';
import MultiSelect from '../components/MultiSelect';
import { Context } from '../data/Context';

export default function TransactionCreationPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { setTitle, setGoBackToUrl, setLoginRedirectUrl, api } =
    useContext(Context);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [groupMembers, setGroupMembers] = useState<Record<string, string>>();
  const selectedDebtorIds = useRef<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!api.loggedIn()) {
      setLoginRedirectUrl(location.pathname);
      navigate('/login');
      return;
    }

    setTitle('Create transaction');
    setGoBackToUrl(`/group/${groupId}`);
    loadGroupMembers();
  }, [groupId]);

  const loadGroupMembers = async () => {
    setGroupMembers(undefined);
    const r = await api.getGroup(groupId ?? '');

    if (r === undefined) {
      navigate(`/group/${groupId}`);
      return;
    }

    setGroupMembers(
      r.members.reduce(
        (acc, member) => ({
          ...acc,
          [member.id]: member.nickname,
        }),
        {} as Record<string, string>,
      ),
    );
  };

  const onSubmit = async (data: FieldValues) => {
    setLoading(true);
    const r = await api.createTransaction(
      groupId ?? '',
      parseFloat(data.amount) * 100,
      data.description,
      selectedDebtorIds.current,
    );
    setLoading(false);

    if (!r) {
      return;
    }

    navigate(`/group/${groupId}`);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant='h5'>Create transaction</Typography>
          </Grid>
          <Grid item xs={12}>
            <CollapsableAlert></CollapsableAlert>
          </Grid>
          <Grid item xs={12}>
            To create a new transaction, please enter the amount, who uses it
            and a description for it.
          </Grid>
          <Grid item xs={12}>
            <TextField
              label='Description'
              disabled={loading}
              error={errors.description !== undefined}
              {...register('description', { required: true })}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            {groupMembers && (
              <MultiSelect
                options={groupMembers}
                onChange={v => {
                  selectedDebtorIds.current = v;
                }}
                disabled={loading}
                error={errors.consumers !== undefined}
              ></MultiSelect>
            )}

            {!groupMembers && <Skeleton height={56}></Skeleton>}
          </Grid>
          <Grid item xs={12}>
            <MoneyTextField
              helperText={errors.amount && 'must be greater than 0'}
              disabled={loading}
              error={errors.amount !== undefined}
              label='Amount (in €)'
              {...register('amount', {
                required: true,
                pattern: /.*[1-9].*/,
              })}
              fullWidth
            ></MoneyTextField>
          </Grid>

          <Grid item xs={12}>
            <LoadingButton loading={loading} type='submit'>
              Create
            </LoadingButton>
          </Grid>
        </Grid>
      </form>
    </>
  );
}
