import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';
import { MockConnector } from 'wagmi/connectors/mock';

import { Success, SuccessProps } from '../Success';
import { Providers, setupClient, getSigners } from 'tests/utils';

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
      render(
        <Success
          {...({ keys: { publicKey: '', privateKey: '' } } as SuccessProps)}
        />,
        {
          wrapper: ({ children }: { children: React.ReactNode }) => (
            <Providers client={client}>{children}</Providers>
          ),
        }
      );
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
  const tree = create(
    <Providers client={client}>
      <Success
        {...({ keys: { publicKey: '', privateKey: '' } } as SuccessProps)}
      />
    </Providers>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
