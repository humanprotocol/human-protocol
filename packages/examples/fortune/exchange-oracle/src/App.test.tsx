import { render, screen } from '@testing-library/react';
import { act } from 'react-test-renderer';
import { vi } from 'vitest';
import { MockConnector } from 'wagmi/connectors/mock';

import App from './App';
import { Providers, setupClient, getSigners } from 'tests/utils';

const alertMock = vi.fn();

vi.stubGlobal('alert', alertMock);

test('renders correctly', async () => {
  const client = setupClient({
    connectors: [
      new MockConnector({
        options: {
          signer: getSigners()[0]!,
          // Turn on `failConnect` flag to simulate connect failure
        },
      }),
    ],
  });

  await act(async () => {
    render(<App />, {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <Providers client={client}>{children}</Providers>
      ),
    });
  });

  const linkElement = screen.getByText(/Select Network/i);
  expect(linkElement).toBeInTheDocument();
});
