import { Chip, Grid, Skeleton, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Context } from '../data/Context';
import { Debt, GroupMember, Transaction } from '../data/Types';
import Debts from '../components/Debts';
import TransactionHistory from '../components/TransactionHistory';
import { Share } from '@mui/icons-material';
import TransactionHistorySkeleton from '../components/TransactionHistorySkeleton';
import TransactionCreationDialog from '../components/TransactionCreationDialog';
import GroupShareDialog from '../components/GroupShareDialog';

export default function LoginPage() {
  const { groupId } = useParams();

  const navigate = useNavigate();
  const location = useLocation();
  const { setTitle, setGoBackToUrl, user, setLoginRedirectUrl, api } =
    useContext(Context);

  const [transactionCreationDialogOpen, setTransactionCreationDialogOpen] =
    useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [groupMembers, setGroupMembers] =
    useState<Record<string, GroupMember>>();
  const [debts, setDebts] = useState<Debt[]>();
  const [transactions, setTransactions] = useState<Transaction[]>();

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

  if (!api.loggedIn()) {
    return <></>;
  }

  return (
    <>
      <Typography variant='h5' sx={{ paddingBottom: 2 }}>
        Your debts
      </Typography>

      <Grid container spacing={2}>
        {debts && groupMembers ? (
          <>
            <Debts groupMembersById={groupMembers} debts={debts}></Debts>
            <Grid item xs='auto'>
              <Chip
                label='invite someone'
                variant='outlined'
                onClick={() => setShareDialogOpen(true)}
                icon={<Share sx={{ height: '.8em' }}></Share>}
              />
            </Grid>
          </>
        ) : (
          new Array(3).fill(0).map((_, i) => (
            <Grid item xs='auto' key={`current-group-skeleton-${i}`}>
              <Skeleton
                variant='rounded'
                width={120}
                height={32}
                sx={{ borderRadius: '16px' }}
              />
            </Grid>
          ))
        )}
      </Grid>

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
          onCreateNewTransaction={() => setTransactionCreationDialogOpen(true)}
        ></TransactionHistory>
      ) : (
        <TransactionHistorySkeleton></TransactionHistorySkeleton>
      )}

      {groupId && groupMembers && (
        <TransactionCreationDialog
          open={transactionCreationDialogOpen}
          onClose={() => setTransactionCreationDialogOpen(false)}
          onSuccess={() => {
            setTransactionCreationDialogOpen(false);
            loadGroupData();
          }}
          groupId={groupId}
          groupMembersById={groupMembers}
        />
      )}

      <GroupShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
      />
    </>
  );
}
