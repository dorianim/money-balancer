import {
  AppBar,
  Toolbar,
  Container,
  Typography,
  Skeleton,
} from '@mui/material';
import { useContext } from 'react';
import { Link } from 'react-router-dom';

import '../css/Header.css';
import { Context } from '../data/Context';

/**
 * Creates a Header Component that displays the reservation steps
 * @return {JSX.Element}
 */
export default function Header() {
  const { title } = useContext(Context);

  const logoContainerStyle = {
    textDecoration: 'none',
    color: 'inherit',
    margin: '0 0 0 0',
    width: 'fit-content',
    padding: '0 0 0 0 !important',
  };

  return (
    <AppBar position='sticky'>
      <Container maxWidth={'md'} className='header-container'>
        <Toolbar className='header-container'>
          <Container
            sx={{
              ...logoContainerStyle,
              display: { xs: 'none', md: 'none' },
            }}
          >
            <Link to='/'></Link>
          </Container>
          <Container
            sx={{
              ...logoContainerStyle,
              display: { xs: 'none', md: 'none' },
            }}
          >
            <Link to='/'></Link>
          </Container>
          <Typography variant='h5'>{title}</Typography>
          {title === '' && <Skeleton height={20} width={200}></Skeleton>}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
