import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

export const theme = createTheme({
  components: {
    MuiToggleButton: {
      defaultProps: {
        disableRipple: true,
      },
    },
  },
  palette: {
    mode: 'dark',
  },
});

/**
 * Sets a MaterialUi theme for its children
 * @param  {any} props accepts JSX elements to wrap theme in
 * @return {JSX.Element}
 */
export default function Theme(props: { children: JSX.Element }) {
  const { children } = props;
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
