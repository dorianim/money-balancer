import { ArrowBack } from '@mui/icons-material';
import {
  AppBar,
  Toolbar,
  Container,
  Typography,
  Skeleton,
  IconButton,
  Collapse,
} from '@mui/material';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { Context } from '../data/Context';

/**
 * Creates a Header Component that displays the reservation steps
 * @return {JSX.Element}
 */
export default function Header() {
  const { title, goBackToUrl } = useContext(Context);
  const navigate = useNavigate();

  return (
    <AppBar position='sticky'>
      <Container maxWidth={'md'}>
        <Toolbar style={{ padding: 0 }}>
          <Collapse
            in={goBackToUrl !== undefined}
            orientation='horizontal'
            sx={{ height: 'auto' }}
          >
            <IconButton
              sx={{ marginRight: 1 }}
              onClick={() => {
                if (goBackToUrl) {
                  navigate(goBackToUrl);
                }
              }}
            >
              <ArrowBack></ArrowBack>
            </IconButton>
          </Collapse>
          <Typography variant='h5'>{title}</Typography>
          {title === '' && <Skeleton height={20} width={200}></Skeleton>}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
