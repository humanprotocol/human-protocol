import React from 'react';
import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { act } from 'react-dom/test-utils';
import { Decrypt } from 'src/components/Kvstore/Decrypt';

import { Providers, setupClient, getSigners } from '../../../../tests/utils';
import { MockConnector } from 'wagmi/connectors/mock';

describe('when rendered Decrypt component', () => {
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
      render(<Decrypt />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers client={client}>{children}</Providers>
        ),
      });
    });
    expect(
      screen.getByText(/Decrypt using your public key and private key/)
    ).toBeInTheDocument();
  });
});

it('Decrypt component renders correctly, corresponds to the snapshot', () => {
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
        <Decrypt />
      </Providers>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
