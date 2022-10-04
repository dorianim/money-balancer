import { ChevronRight, ExpandMore } from '@mui/icons-material';
import {
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import { useContext } from 'react';
import { Context } from '../data/Context';
import { Transaction, GroupMember } from '../data/Types';
import { ExpandMoreButton } from './ExpandMoreButton';
import TransactionCard from './TransactionCard';

export default function TransactionHistory(params: {
  transactions: Transaction[];
  groupMembersById: Record<string, GroupMember>;
  currentUserId: string;
  onChanged: () => void;
}) {
  const { transactions, groupMembersById, currentUserId, onChanged } = params;
  const { api } = useContext(Context);

  const deleteTransaction = async (transaction: Transaction) => {
    await api.deleteTransactionOfGroup(transaction.group_id, transaction.id);
    onChanged();
  };

  return (
    <>
      {transactions.map(transaction => (
        <Grid item xs={12} key={`transaction-${transaction.id}`}>
          <TransactionCard
            groupMembersById={groupMembersById}
            currentUserId={currentUserId}
            transaction={transaction}
            onDelete={deleteTransaction}
          />
        </Grid>
      ))}
    </>
  );
}
