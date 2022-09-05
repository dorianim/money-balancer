import { Close } from '@mui/icons-material';
import { Alert, Collapse, IconButton, SxProps, Theme } from '@mui/material';
import { useContext } from 'react';
import { Context } from '../data/Context';

export default function CollapsableAlert(props: { sx?: SxProps<Theme> }) {
  const { sx } = props;
  const { error, setError } = useContext(Context);

  return (
    <Collapse in={error.open}>
      <Alert
        action={
          <IconButton
            aria-label='close'
            color='inherit'
            size='small'
            onClick={() => {
              setError({ ...error, open: false });
            }}
          >
            <Close fontSize='inherit' />
          </IconButton>
        }
        severity={error.severity}
        variant='filled'
        sx={sx}
      >
        {error.message}
      </Alert>
    </Collapse>
  );
}
