import { Card, CardContent, Grid, Skeleton } from '@mui/material';

export default function TransactionHistorySkeleton() {
  return (
    <>
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
    </>
  );
}
