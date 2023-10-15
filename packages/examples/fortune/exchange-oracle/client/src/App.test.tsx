import { render, screen } from '@testing-library/react';
import { act } from 'react-test-renderer';
import { vi } from 'vitest';

import { Providers, ethereumClient } from 'tests/utils';
import App from './App';

vi.mock('./connectors/connectors', () => ({
  projectId: 'projectId',
  ethereumClient: ethereumClient,
}));

test('renders correctly', async () => {
  await act(async () => {
    render(<App />, {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <Providers>{children}</Providers>
      ),
    });
  });

  const linkElement = screen.getByText(/Select Network/i);
  expect(linkElement).toBeInTheDocument();
});
