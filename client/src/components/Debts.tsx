import { Chip, Grid } from '@mui/material';
import { GroupMember, Debt } from '../data/Types';

export default function Debts(params: {
  debts: Debt[];
  groupMembersById: Record<string, GroupMember>;
}) {
  const { debts, groupMembersById } = params;

  return (
    <Grid container spacing={2}>
      {debts.map(debt => (
        <Grid key={`current-debt-with-${debt.debtor_id}`} xs='auto' item>
          <Chip
            label={
              debt.amount === 0
                ? `You are even with ${
                    groupMembersById[debt.debtor_id].nickname
                  }`
                : debt.amount < 0
                ? `You owe ${groupMembersById[debt.debtor_id].nickname} ${
                    debt.amount / 100
                  }€`
                : `${groupMembersById[debt.debtor_id].nickname} ows you ${
                    debt.amount / 100
                  }€`
            }
            color={debt.amount < 0 ? 'error' : 'success'}
          />
        </Grid>
      ))}
    </Grid>
  );
}
