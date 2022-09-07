import { Add } from '@mui/icons-material';
import {
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
} from '@mui/material';
import { Purchase, Users } from '../data/Types';

export default function PurchaseHistory(params: {
  purchases: Purchase[];
  users: Users;
  currentUserId: string;
  onCreateNewPurchase: () => void;
}) {
  const { purchases, users, currentUserId, onCreateNewPurchase } = params;

  return (
    <Grid spacing={2} container>
      <Grid item xs={12}>
        <Button variant='outlined' onClick={onCreateNewPurchase} fullWidth>
          <Add sx={{ marginRight: 1 }}></Add>
          New purchase
        </Button>
      </Grid>

      {purchases.map(purchase => (
        <Grid
          item
          xs={12}
          key={`purchase-${purchase.timestamp}-${purchase.amount}-${
            purchase.purchaser
          }-${purchase.consumers.join('-')}`}
        >
          <Card>
            <CardContent>
              <Grid container spacing={2} alignItems='center'>
                <Grid item>
                  <Chip
                    label={(purchase.amount / 100).toFixed(2) + '€'}
                    color={
                      purchase.purchaser === currentUserId
                        ? 'success'
                        : purchase.consumers.indexOf(currentUserId) >= 0
                        ? 'error'
                        : 'info'
                    }
                  ></Chip>
                </Grid>
                <Grid item>
                  <Typography variant='h6'>{purchase.description}</Typography>
                </Grid>

                <Grid item>
                  <Typography variant='body2'>
                    {new Date(purchase.timestamp).toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item>
                  <Typography variant='body2'>
                    Purchased by{' '}
                    <b>
                      {purchase.purchaser === currentUserId
                        ? 'you'
                        : users[purchase.purchaser].nickname}
                    </b>{' '}
                    for{' '}
                    {purchase.consumers
                      .map(consumerId =>
                        consumerId === currentUserId
                          ? 'yourself'
                          : users[consumerId].nickname,
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
    </Grid>
  );
}
