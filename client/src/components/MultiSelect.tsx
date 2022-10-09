import {
  Box,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { useState } from 'react';

export default function MultiSelect(props: {
  options: Record<string, string>;
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  error?: boolean;
}) {
  const { disabled, error, options, onChange } = props;

  const [selectedConsumers, setSelectedConsumers] = useState<string[]>([]);
  const onConsumersChange = (e: SelectChangeEvent<string[]>) => {
    const value =
      typeof e.target.value === 'string'
        ? e.target.value.split(',')
        : e.target.value;
    setSelectedConsumers(value);
    onChange(value);
  };

  return (
    <FormControl fullWidth>
      <InputLabel id='consumers-checkbox-label'>Consumers</InputLabel>
      <Select
        multiple
        labelId='consumers-checkbox-label'
        id='consumers-checkbox'
        name='consumers'
        value={selectedConsumers}
        onChange={e => onConsumersChange(e)}
        input={<OutlinedInput id='select-multiple-chip' label='Chip' />}
        disabled={disabled}
        error={error}
        required
        renderValue={selected => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map(value => (
              <Chip
                key={`dialog-consumer-chip-${value}`}
                label={options?.[value]}
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
        {Object.keys(options).map(key => (
          <MenuItem key={`dialog-consumer-menu-item-${key}`} value={key}>
            <Checkbox checked={selectedConsumers.indexOf(key) > -1} />
            <ListItemText primary={options[key]} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
