import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useContext, useEffect, useRef, useState } from 'react';
import { Context } from '../data/Context';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

export type ThemeType = 'dark' | 'light' | 'system';

/**
 * Sets a MaterialUi theme for its children
 * @param  {any} props accepts JSX elements to wrap theme in
 * @return {JSX.Element}
 */
export default function Theme(props: { children: JSX.Element }) {
  const { children } = props;
  const { theme } = useContext(Context);
  const eventListenerAdded = useRef(false);
  const themeRef = useRef<ThemeType>(theme);

  const getThemeToUse = () => {
    switch (themeRef.current) {
      case 'dark':
        return darkTheme;
      case 'light':
        return lightTheme;
      case 'system':
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return darkTheme;
        } else {
          return lightTheme;
        }
    }
  };

  const [themeToUse, setThemeToUse] = useState(getThemeToUse());

  useEffect(() => {
    themeRef.current = theme;
    setThemeToUse(getThemeToUse());

    if (eventListenerAdded.current) return;

    eventListenerAdded.current = true;
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => {
        setThemeToUse(getThemeToUse());
      });
  }, [theme]);

  return (
    <ThemeProvider theme={themeToUse}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
