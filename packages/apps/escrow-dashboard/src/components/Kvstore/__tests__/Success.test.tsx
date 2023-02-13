import React from 'react';
import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { act } from 'react-dom/test-utils';
import { Success } from 'src/components/Kvstore/Success';
import {
  Providers,
  setupClient,
  getSigners,
  testChains,
} from '../../../../tests/utils';
import { MockConnector } from '@wagmi/core/connectors/mock';

describe('when rendered Success component', () => {
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
      render(<Success keys={{ publicKey: '', privateKey: '' }} />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers client={client}>{children}</Providers>
        ),
      });
    });
    expect(screen.getByText(/Success!/)).toBeInTheDocument();
  });
});

it('Success component renders correctly, corresponds to the snapshot', () => {
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
        <Success keys={{ publicKey: '', privateKey: '' }} />
      </Providers>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
