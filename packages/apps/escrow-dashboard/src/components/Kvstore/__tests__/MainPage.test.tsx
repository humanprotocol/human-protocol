import { render, screen } from '@testing-library/react';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';
import { MockConnector } from 'wagmi/connectors/mock';

import { MainPage } from '../MainPage';
import { Providers, setupClient, getSigners } from 'tests/utils';

describe('when rendered MainPage component', () => {
  it('should render `text` prop', async () => {
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
      render(<MainPage />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers client={client}>{children}</Providers>
        ),
      });
    });
    expect(screen.getByText(/Empower HUMAN Scan/)).toBeInTheDocument();
  });
});

it('MainPage component renders correctly, corresponds to the snapshot', () => {
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
  const tree = create(
    <Providers client={client}>
      <MainPage />
    </Providers>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
