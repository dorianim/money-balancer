import { render, screen } from '@testing-library/react';
import App from './App';

test('redirects anonymous users to login', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
});
