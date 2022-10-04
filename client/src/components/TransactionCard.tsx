import { Delete, ExpandMore } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { GroupMember, Transaction } from '../data/Types';
import { ExpandMoreButton } from './ExpandMoreButton';

export default function TransactionCard(props: {
  transaction: Transaction;
  currentUserId: string;
  groupMembersById: Record<string, GroupMember>;
  onDelete: (transaction: Transaction) => void;
}) {
  const { transaction, currentUserId, groupMembersById, onDelete } = props;

  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await onDelete(transaction);
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader
        avatar={
          <Chip
            label={
              (
                transaction.debts.reduce((acc, debt) => acc + debt.amount, 0) /
                100
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
        }
        action={
          <ExpandMoreButton
            expand={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            <ExpandMore />
          </ExpandMoreButton>
        }
        title={transaction.description}
        subheader={new Date(transaction.timestamp * 1000).toLocaleString()}
      />

      <Collapse in={expanded} timeout='auto' unmountOnExit>
        <CardContent>
          <Typography>
            Purchased by{' '}
            <b>
              {transaction.creditor_id === currentUserId
                ? 'you'
                : groupMembersById[transaction.creditor_id].nickname}
            </b>
          </Typography>
          <List dense={true} sx={{ padding: 0 }}>
            <ListSubheader sx={{ bgcolor: 'transparent', padding: 0 }}>
              Split between
            </ListSubheader>
            {transaction.debts.map(debt => (
              <ListItem
                key={`debt-${transaction.id}-${debt.debtor_id}`}
                secondaryAction={<Chip label={`${debt.amount / 100}€`} />}
              >
                <ListItemText
                  primary={
                    debt.debtor_id === currentUserId
                      ? 'you'
                      : `${groupMembersById[debt.debtor_id].nickname}`
                  }
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
        <CardActions>
          {transaction.creditor_id === currentUserId && (
            <LoadingButton
              color='error'
              loading={loading}
              startIcon={<Delete />}
              onClick={handleDelete}
            >
              delete
            </LoadingButton>
          )}
        </CardActions>
      </Collapse>
    </Card>
  );
}
