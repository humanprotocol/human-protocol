import * as React from 'react';
import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { act } from 'react-dom/test-utils';
import { FundingMethod } from 'src/components/FundingMethod';
import { Providers, setupClient, getSigners } from 'tests/utils';
import { MockConnector } from '@wagmi/core/connectors/mock';

describe('when rendered FundingMethod component', () => {
  it('should render Crypto and Fiat buttons', async () => {
    const client = setupClient({
      connectors: [
        new MockConnector({ options: { signer: getSigners()[0]! } }),
      ],
    });

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      render(<FundingMethod onChange={() => 1} />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers client={client}>{children}</Providers>
        ),
      });
    });
    expect(screen.getByText('Crypto')).toBeTruthy();
    expect(screen.getByText('Fiat (Coming soon)')).toBeTruthy();
  });

  it('Fiat button should be disabled', async () => {
    const client = setupClient({
      connectors: [
        new MockConnector({ options: { signer: getSigners()[0]! } }),
      ],
    });

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      render(<FundingMethod onChange={() => 1} />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers client={client}>{children}</Providers>
        ),
      });
    });

    expect(screen.getByText('Fiat (Coming soon)')).toBeDisabled();
  });
});

it('FundingMethod component renders correctly, corresponds to the snapshot', () => {
  const client = setupClient({
    connectors: [new MockConnector({ options: { signer: getSigners()[0]! } })],
  });
  const tree = renderer
    .create(
      <Providers client={client}>
        <FundingMethod onChange={() => 1} />
      </Providers>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
