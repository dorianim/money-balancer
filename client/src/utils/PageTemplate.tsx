import Container from '@mui/material/Container';
import LocalizationProviderWrapper from './LocalizationProviderWrapper';

/**
 * Wrapps the page with all necessary utils
 * @param  {{ children: JSX.Element }} props accepts JSX elements to wrap theme in
 * @return {JSX.Element}
 */
export default function PageTemplate(props: { children: JSX.Element }) {
  const { children } = props;

  return (
    <LocalizationProviderWrapper>
      <Container
        sx={{ marginTop: '16px', marginBottom: '16px' }}
        className='root-container'
        maxWidth={'md'}
      >
        {children}
      </Container>
    </LocalizationProviderWrapper>
  );
}
