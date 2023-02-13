import React from 'react';
import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { act } from 'react-dom/test-utils';
import { ImportPubkey } from 'src/components/Kvstore/ImportPubkey';

import {
  Providers,
  setupClient,
  getSigners,
  testChains,
} from '../../../../tests/utils';
import { MockConnector } from '@wagmi/core/connectors/mock';

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
      render(<ImportPubkey />, {
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
  const tree = renderer
    .create(
      <Providers client={client}>
        <ImportPubkey />
      </Providers>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
