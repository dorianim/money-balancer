import { ArrowBack, MoreVert } from '@mui/icons-material';
import {
  AppBar,
  Toolbar,
  Container,
  Typography,
  Skeleton,
  IconButton,
  Collapse,
} from '@mui/material';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Context } from '../data/Context';
import HeaderMenu from './HeaderMenu';

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

      <HeaderMenu
        anchorEl={anchorEl}
        onClose={() => {
          setAnchorEl(undefined);
        }}
      ></HeaderMenu>
    </AppBar>
  );
}
