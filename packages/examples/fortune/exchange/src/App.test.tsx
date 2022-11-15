import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders metamask', () => {
  render(<App />);
  const linkElement = screen.getByText(/Metamask not installed/i);
  expect(linkElement).toBeInTheDocument();
});
