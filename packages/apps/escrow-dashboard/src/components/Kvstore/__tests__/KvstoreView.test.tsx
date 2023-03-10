import React from 'react';
import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { act } from 'react-dom/test-utils';
import { KvstoreView } from 'src/components/Kvstore/KvstoreView';

import { Providers, setupClient, getSigners } from '../../../../tests/utils';
import { MockConnector } from 'wagmi/connectors/mock';

describe('when rendered KvstoreView component', () => {
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
      render(<KvstoreView />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers client={client}>{children}</Providers>
        ),
      });
    });
    expect(
      screen.getByText(
        /Store your public key in the blockchain, use your public key to encrypt or decrypt data./
      )
    ).toBeInTheDocument();
  });
});

it('KvstoreView component renders correctly, corresponds to the snapshot', () => {
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
  const tree = renderer
    .create(
      <Providers client={client}>
        <KvstoreView />
      </Providers>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
