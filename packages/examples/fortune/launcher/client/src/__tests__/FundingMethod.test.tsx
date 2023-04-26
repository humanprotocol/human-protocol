import { render, screen } from '@testing-library/react';
import { MockConnector } from '@wagmi/core/connectors/mock';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';
import { Providers, setupClient, getSigners } from '../../tests/utils';
import { FundingMethod } from '../components/FundingMethod';

describe('when rendered FundingMethod component', () => {
  it('should render Crypto and Fiat buttons', async () => {
    const client = setupClient({
      connectors: [
        new MockConnector({ options: { signer: getSigners()[0]! } }),
      ],
    });

    await act(async () => {
      render(<FundingMethod onChange={() => 1} />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers client={client}>{children}</Providers>
        ),
      });
    });
    expect(screen.getByText('Crypto')).toBeTruthy();
    expect(screen.getByText('Fiat')).toBeTruthy();
  });

  it('Crypto and fiat buttons should be enabled', async () => {
    const client = setupClient({
      connectors: [
        new MockConnector({ options: { signer: getSigners()[0]! } }),
      ],
    });

    await act(async () => {
      render(<FundingMethod onChange={() => 1} />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers client={client}>{children}</Providers>
        ),
      });
    });

    expect(screen.getByText('Crypto')).toBeEnabled();
    expect(screen.getByText('Fiat')).toBeEnabled();
  });
});

it('FundingMethod component renders correctly, corresponds to the snapshot', () => {
  const client = setupClient({
    connectors: [new MockConnector({ options: { signer: getSigners()[0]! } })],
  });
  const tree = create(
    <Providers client={client}>
      <FundingMethod onChange={() => 1} />
    </Providers>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
