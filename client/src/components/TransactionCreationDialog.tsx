import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import { useContext, useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { Context } from '../data/Context';
import { GroupMember } from '../data/Types';
import CollapsableAlert from './CollapsableAlert';

export default function TransactionCreationDialog(props: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  groupId: string;
  groupMembersById: Record<string, GroupMember>;
}) {
  const { open, onClose, onSuccess, groupId, groupMembersById } = props;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const { api } = useContext(Context);

  const [loading, setLoading] = useState(false);
  const [selectedConsumers, setSelectedConsumers] = useState<string[]>([]);

  const onSubmit = async (data: FieldValues) => {
    setLoading(true);
    const r = await api.createTransaction(
      groupId ?? '',
      parseFloat(data.amount) * 100,
      data.description,
      selectedConsumers,
    );
    setLoading(false);

    if (!r) {
      return;
    }

    onSuccess();
  };

  const onConsumersChange = (e: SelectChangeEvent<string[]>) => {
    const value =
      typeof e.target.value === 'string'
        ? e.target.value.split(',')
        : e.target.value;
    setSelectedConsumers(value);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>New transaction</DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <CollapsableAlert sx={{ marginBottom: 2 }}></CollapsableAlert>

          <DialogContentText>
            To create a new transaction, please enter the amount, who uses it
            and a description for it.
          </DialogContentText>
          <TextField
            label='Amount (in €)'
            inputProps={{
              inputMode: 'numeric',
              step: '0.01',
            }}
            helperText={errors.amount && 'must be greater than 0'}
            disabled={loading}
            error={errors.amount !== undefined}
            defaultValue={'0.00'}
            {...register('amount', {
              required: true,
              pattern: /.*[1-9].*/,
              onChange: e => {
                e.target.value = e.target.value.replace(',', '.');
                let amount: string = e.target.value.replace(/[^0-9]/g, '');

                while (amount.length < 3) {
                  amount = '0' + amount;
                }

                amount =
                  amount.substring(0, amount.length - 2) +
                  '.' +
                  amount.substring(amount.length - 2);

                while (amount[0] === '0' && amount.length > 4) {
                  amount = amount.substring(1);
                }

                e.target.value = amount;
              },
            })}
            sx={{ marginTop: 2 }}
            fullWidth
            autoFocus
          />

          <TextField
            label='Description'
            disabled={loading}
            error={errors.description !== undefined}
            {...register('description', { required: true })}
            sx={{ marginTop: 2 }}
            fullWidth
          />

          <FormControl sx={{ marginTop: 2 }} fullWidth>
            <InputLabel id='consumers-checkbox-label'>Consumers</InputLabel>
            <Select
              multiple
              labelId='consumers-checkbox-label'
              id='consumers-checkbox'
              name='consumers'
              value={selectedConsumers}
              onChange={e => onConsumersChange(e)}
              input={<OutlinedInput id='select-multiple-chip' label='Chip' />}
              disabled={loading}
              error={errors.consumers !== undefined}
              required
              renderValue={selected => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map(value => (
                    <Chip
                      key={`dialog-consumer-chip-${value}`}
                      label={groupMembersById?.[value].nickname}
                    />
                  ))}
                </Box>
              )}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 48 * 4.5 + 8,
                    width: 250,
                  },
                },
              }}
            >
              {Object.values(groupMembersById || {}).map(user => (
                <MenuItem
                  key={`dialog-consumer-menu-item-${user.id}`}
                  value={user.id}
                >
                  <Checkbox checked={selectedConsumers.indexOf(user.id) > -1} />
                  <ListItemText primary={user.nickname} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <LoadingButton loading={loading} type='submit'>
            Create
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
