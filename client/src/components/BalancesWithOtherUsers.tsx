import { Chip, Grid } from '@mui/material';
import { Users, UserBalances } from '../data/Types';

export default function BalancesWithOtherUsers(params: {
  balancesWithOtherUsers: UserBalances;
  users: Users;
}) {
  const { balancesWithOtherUsers, users } = params;

  return (
    <Grid container spacing={2}>
      {Object.keys(balancesWithOtherUsers).map(otherUserId => (
        <Grid key={`current-balance-with-${otherUserId}`} xs='auto' item>
          <Chip
            label={
              balancesWithOtherUsers[otherUserId] === 0
                ? `You are even with ${users[otherUserId].nickname}`
                : balancesWithOtherUsers[otherUserId] < 0
                ? `You owe ${users[otherUserId].nickname} ${
                    balancesWithOtherUsers[otherUserId] / 100
                  }€`
                : `${users[otherUserId].nickname} ows you ${
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
  );
}
