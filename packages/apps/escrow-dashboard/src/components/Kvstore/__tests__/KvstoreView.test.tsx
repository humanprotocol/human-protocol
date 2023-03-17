import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';
import { MockConnector } from 'wagmi/connectors/mock';

import { KvstoreView } from '../KvstoreView';
import { Providers, setupClient, getSigners } from 'tests/utils';

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
  const tree = create(
    <Providers client={client}>
      <KvstoreView />
    </Providers>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
