import {
  BrightnessMedium,
  Check,
  DarkMode,
  LightMode,
  Logout,
} from '@mui/icons-material';
import {
  Collapse,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Context } from '../data/Context';
import { ThemeType } from '../utils/Theme';

export default function HeaderMenu(props: {
  anchorEl: Element | undefined;
  onClose: () => void;
}) {
  const { anchorEl, onClose } = props;
  const { theme, setTheme, api } = useContext(Context);

  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <Menu
      anchorEl={anchorEl}
      open={anchorEl !== undefined}
      onClose={onClose}
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
      <MenuItem onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}>
        Theme
        {
          {
            ['system']: (
              <BrightnessMedium sx={{ marginLeft: 1 }}></BrightnessMedium>
            ),
            ['dark']: <DarkMode sx={{ marginLeft: 1 }}></DarkMode>,
            ['light']: <LightMode sx={{ marginLeft: 1 }}></LightMode>,
          }[theme]
        }
      </MenuItem>

      <Collapse in={themeDropdownOpen}>
        {['system', 'dark', 'light'].map(availableTheme => (
          <MenuItem
            key={`header-menu-theme-chooser-item-${availableTheme}`}
            onClick={() => {
              setTheme(availableTheme as ThemeType);
              setThemeDropdownOpen(false);
            }}
          >
            {theme === availableTheme && (
              <ListItemIcon>
                <Check />
              </ListItemIcon>
            )}
            <ListItemText inset={theme !== availableTheme}>
              {availableTheme}
            </ListItemText>
          </MenuItem>
        ))}
        <Divider />
      </Collapse>

      <MenuItem
        onClick={() => {
          onClose();
          api.logout();
          navigate('/login');
        }}
      >
        Logout <Logout sx={{ marginLeft: 1 }}></Logout>
      </MenuItem>
    </Menu>
  );
}
