import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';
import { MockConnector } from 'wagmi/connectors/mock';

import { GeneratePubkey, GeneratePubkeyProps } from '../GeneratePubkey';
import { Providers, setupClient, getSigners } from 'tests/utils';

describe('when rendered GeneratePubkey component', () => {
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
      render(<GeneratePubkey {...({} as GeneratePubkeyProps)} />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers client={client}>{children}</Providers>
        ),
      });
    });
    expect(screen.getByText(/Generate Public Key/)).toBeInTheDocument();
  });
});

it('GeneratePubkey component renders correctly, corresponds to the snapshot', () => {
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
      <GeneratePubkey {...({} as GeneratePubkeyProps)} />
    </Providers>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
