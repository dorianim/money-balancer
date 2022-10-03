import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Tooltip,
} from '@mui/material';
import { useState } from 'react';

export default function GroupShareDialog(props: {
  open: boolean;
  onClose: () => void;
}) {
  const { open, onClose } = props;

  const [tooltipText, setTooltipText] = useState('click to copy');

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Share group</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Share this link with your friends to let them join your group.
        </DialogContentText>
        <Tooltip
          title={tooltipText}
          arrow
          onClose={() => setTooltipText('click to copy')}
        >
          <TextField
            fullWidth
            label='Link'
            value={`${window.location.href}/join`}
            sx={{ marginTop: 2 }}
            onClick={() => {
              setTooltipText('copied!');
              navigator.clipboard.writeText(`${window.location.href}/join`);
            }}
            InputProps={{
              readOnly: true,
            }}
          />
        </Tooltip>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
