import { screen, render } from '@testing-library/react';
import { act, create } from 'react-test-renderer';
import { MockConnector } from 'wagmi/connectors/mock';

import { Escrow } from './Escrow';
import { Providers, setupClient, getSigners } from 'tests/utils';

describe('When rendered Escrow component', () => {
  it('renders landing page', async () => {
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
      render(<Escrow />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers client={client}>{children}</Providers>
        ),
      });
    });

    expect(screen.getByTestId('escrowAddress')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Send Fortune' })
    ).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    const component = create(<Escrow />);
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
    return;
  });
});
