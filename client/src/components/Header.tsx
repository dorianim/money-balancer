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
import { Link, useLocation } from 'react-router-dom';

import { Context } from '../data/Context';

/**
 * Creates a Header Component that displays the reservation steps
 * @return {JSX.Element}
 */
export default function Header() {
  const { title } = useContext(Context);
  const location = useLocation();

  const logoContainerStyle = {
    textDecoration: 'none',
    color: 'inherit',
    margin: '0 0 0 0',
    width: 'fit-content',
    padding: '0 0 0 0 !important',
  };

  return (
    <AppBar position='sticky'>
      <Container maxWidth={'md'}>
        <Toolbar style={{ padding: 0 }}>
          <Collapse
            in={location.pathname !== '/'}
            orientation='horizontal'
            sx={{ height: 'auto' }}
          >
            <Link to='/'>
              <IconButton sx={{ marginRight: 1 }}>
                <ArrowBack></ArrowBack>
              </IconButton>
            </Link>
          </Collapse>
          <Typography variant='h5'>{title}</Typography>
          {title === '' && <Skeleton height={20} width={200}></Skeleton>}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
