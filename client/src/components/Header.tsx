import { ArrowBack, Logout, MoreVert } from '@mui/icons-material';
import {
  AppBar,
  Toolbar,
  Container,
  Typography,
  Skeleton,
  IconButton,
  Collapse,
  Menu,
  MenuItem,
} from '@mui/material';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Context } from '../data/Context';

/**
 * Creates a Header Component that displays the reservation steps
 * @return {JSX.Element}
 */
export default function Header() {
  const { title, goBackToUrl, api } = useContext(Context);
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | undefined>(
    undefined,
  );

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

          <Collapse
            in={api.loggedIn()}
            orientation='horizontal'
            sx={{ height: 'auto', marginLeft: 'auto' }}
          >
            <IconButton onClick={e => setAnchorEl(e.currentTarget)}>
              <MoreVert></MoreVert>
            </IconButton>
          </Collapse>
        </Toolbar>
      </Container>

      <Menu
        anchorEl={anchorEl}
        open={anchorEl !== undefined}
        onClose={() => setAnchorEl(undefined)}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(undefined);
            api.logout();
            navigate('/login');
          }}
        >
          <Logout sx={{ marginRight: 1 }}></Logout> Logout
        </MenuItem>
      </Menu>
    </AppBar>
  );
}
