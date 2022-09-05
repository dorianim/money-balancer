import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import deLocale from 'date-fns/locale/de';

/**
 * Sets a Localization Context for TimeInputs
 * @param  {{ children: JSX.Element }} props
 * @return {JSX.Element}
 */
export default function LocalizationProviderWrapper(props: {
  children: JSX.Element;
}) {
  const { children } = props;

  return (
    <LocalizationProvider adapterLocale={deLocale} dateAdapter={AdapterDateFns}>
      {children}
    </LocalizationProvider>
  );
}
