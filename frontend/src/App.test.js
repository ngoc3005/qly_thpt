import { render, screen } from '@testing-library/react';
import App from './App';

test('hien thi ten module quan ly hoc sinh', () => {
  render(<App />);
  const brand = screen.getAllByText(/THPT/i);
  expect(brand.length).toBeGreaterThan(0);
});
