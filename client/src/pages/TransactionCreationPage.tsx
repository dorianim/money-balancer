import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Grid, Skeleton, Tab, TextField, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import CollapsableAlert from '../components/CollapsableAlert';
import MoneyTextField from '../components/MoneyTextField';
import MultiSelect from '../components/MultiSelect';
import { Context } from '../data/Context';
import { Debt } from '../data/Types';

enum SplitType {
  Equally = 'equally',
  Manual = 'manual',
  Percentage = 'percentage',
  Adjustment = 'adjustemt',
  Shares = 'shares',
}

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
  const [selectedDebtorIds, setSelectedDebtorIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(SplitType.Equally);

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
    let r;
    setLoading(true);
    switch (currentTab) {
      case SplitType.Equally: {
        r = await createTransactionEqually(data);
        break;
      }
      case SplitType.Manual: {
        r = await createTransactionManual(data);
        break;
      }
      default:
        console.error(`Unknown split type ${currentTab}`);
        return;
    }

    setLoading(false);

    if (!r) {
      return;
    }
    navigate(`/group/${groupId}`);
  };

  const createTransactionEqually = async (data: FieldValues) => {
    return await api.createTransactionFromAmount(
      groupId ?? '',
      parseFloat(data[`${SplitType.Equally}_amount`]) * 100,
      data.description,
      selectedDebtorIds,
    );
  };

  const createTransactionManual = async (data: FieldValues) => {
    const debts: Debt[] = selectedDebtorIds.map(debtorId => {
      return {
        debtor_id: debtorId,
        amount:
          parseFloat(data[`${SplitType.Manual}_amount_${debtorId}`]) * 100,
        was_split_unequally: false,
      };
    });

    return await api.createTransactionFromDebts(
      groupId ?? '',
      data.description,
      debts,
    );
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
                  setSelectedDebtorIds(v);
                }}
                disabled={loading}
                error={errors.consumers !== undefined}
                label='Debtors'
              ></MultiSelect>
            )}

            {!groupMembers && <Skeleton height={56}></Skeleton>}
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ width: '100%', typography: 'body1' }}>
              <TabContext value={currentTab}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <TabList
                    onChange={(_, newTab) => setCurrentTab(newTab)}
                    aria-label='lab API tabs example'
                    variant='scrollable'
                    scrollButtons
                    allowScrollButtonsMobile
                  >
                    <Tab label='equally' value={SplitType.Equally} />
                    <Tab label='manual' value={SplitType.Manual} />
                    <Tab label='by percentage' value={SplitType.Percentage} />
                    <Tab label='by adjustment' value={SplitType.Adjustment} />
                    <Tab label='by shares' value={SplitType.Shares} />
                  </TabList>
                </Box>
                <TabPanel
                  value={SplitType.Equally}
                  sx={{ paddingLeft: 0, paddingRight: 0, paddingBottom: 0 }}
                >
                  <MoneyTextField
                    helperText={errors.amount && 'must be greater than 0'}
                    disabled={loading}
                    error={errors.amount !== undefined}
                    label='Amount (in €)'
                    {...register(`${SplitType.Equally}_amount`, {
                      required: false, // currentTab === SplitType.Equally,
                      pattern:
                        currentTab === SplitType.Equally ? /.*[1-9].*/ : /.*/,
                    })}
                    fullWidth
                  ></MoneyTextField>
                </TabPanel>

                <TabPanel
                  value={SplitType.Manual}
                  sx={{ paddingLeft: 0, paddingRight: 0, paddingBottom: 0 }}
                >
                  {groupMembers &&
                    selectedDebtorIds.map(memberId => (
                      <MoneyTextField
                        helperText={errors.amount && 'must be greater than 0'}
                        disabled={loading}
                        error={errors.amount !== undefined}
                        key={`manual-amount-for-${memberId}`}
                        label={`${groupMembers[memberId]} (amount in €)`}
                        {...register(`${SplitType.Manual}_amount_${memberId}`, {
                          required: currentTab === SplitType.Manual,
                          pattern:
                            currentTab === SplitType.Manual
                              ? /.*[1-9].*/
                              : /.*/,
                        })}
                        fullWidth
                        sx={{ marginBottom: 2 }}
                      ></MoneyTextField>
                    ))}

                  {selectedDebtorIds.length === 0 && (
                    <p>Please select some debtors first.</p>
                  )}
                </TabPanel>
                <TabPanel value='3'>Item Three</TabPanel>
              </TabContext>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <LoadingButton
              loading={loading}
              type='submit'
              variant='contained'
              fullWidth
            >
              Create
            </LoadingButton>
          </Grid>
        </Grid>
      </form>
    </>
  );
}
