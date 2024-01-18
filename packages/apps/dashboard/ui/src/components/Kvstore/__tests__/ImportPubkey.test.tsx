import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';
import { MockConnector } from 'wagmi/connectors/mock';

import { ImportPubkey, ImportPubkeyProps } from '../ImportPubkey';
import { Providers, setupClient, getSigners } from 'tests/utils';

describe('when rendered ImportPubkey component', () => {
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
      render(<ImportPubkey {...({} as ImportPubkeyProps)} />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers client={client}>{children}</Providers>
        ),
      });
    });
    expect(screen.getByText(/Import your public key/)).toBeInTheDocument();
  });
});

it('ImportPubkey component renders correctly, corresponds to the snapshot', () => {
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
      <ImportPubkey {...({} as ImportPubkeyProps)} />
    </Providers>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
