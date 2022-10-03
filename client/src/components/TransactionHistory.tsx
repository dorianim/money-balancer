import { Card, CardContent, Chip, Grid, Typography } from '@mui/material';
import { Transaction, GroupMember } from '../data/Types';

export default function TransactionHistory(params: {
  transactions: Transaction[];
  groupMembersById: Record<string, GroupMember>;
  currentUserId: string;
}) {
  const { transactions, groupMembersById, currentUserId } = params;

  return (
    <>
      {transactions.map(transaction => (
        <Grid item xs={12} key={`transaction-${transaction.id}`}>
          <Card>
            <CardContent>
              <Grid container spacing={2} alignItems='center'>
                <Grid item>
                  <Chip
                    label={
                      (
                        transaction.debts.reduce(
                          (acc, debt) => acc + debt.amount,
                          0,
                        ) / 100
                      ).toFixed(2) + '€'
                    }
                    color={
                      transaction.creditor_id === currentUserId
                        ? 'success'
                        : transaction.debts
                            .map(debt => debt.debtor_id)
                            .indexOf(currentUserId) >= 0
                        ? 'error'
                        : 'info'
                    }
                  ></Chip>
                </Grid>
                <Grid item>
                  <Typography variant='h6'>
                    {transaction.description}
                  </Typography>
                </Grid>

                <Grid item>
                  <Typography variant='body2'>
                    {new Date(transaction.timestamp).toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item>
                  <Typography variant='body2'>
                    Purchased by{' '}
                    <b>
                      {transaction.creditor_id === currentUserId
                        ? 'you'
                        : groupMembersById[transaction.creditor_id].nickname}
                    </b>{' '}
                    for{' '}
                    {transaction.debts
                      .map(debt =>
                        debt.debtor_id === currentUserId
                          ? 'yourself'
                          : groupMembersById[debt.debtor_id].nickname,
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
    </>
  );
}
