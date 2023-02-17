import * as React from 'react';
import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { act } from 'react-dom/test-utils';
import { LaunchSuccess } from 'src/components/LaunchSuccess';
import { Providers, setupClient, getSigners } from 'tests/utils';
import { MockConnector } from '@wagmi/core/connectors/mock';

const jobResponse = {
  escrowAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  exchangeUrl:
    'https://localhost:3001?address=0x5FbDB2315678afecb367f032d93F642f64180aa3',
};

describe('when rendered LaunchSuccess component', () => {
  it('should render texts', async () => {
    const client = setupClient({
      connectors: [
        new MockConnector({ options: { signer: getSigners()[0]! } }),
      ],
    });

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      render(
        <LaunchSuccess jobResponse={jobResponse} onCreateNewEscrow={() => 1} />,
        {
          wrapper: ({ children }: { children: React.ReactNode }) => (
            <Providers client={client}>{children}</Providers>
          ),
        }
      );
    });
    expect(screen.getByText('Success!')).toBeTruthy();
    expect(screen.getByText('Your escrow has been created')).toBeTruthy();
    expect(screen.getByText(jobResponse.escrowAddress)).toBeTruthy();
    expect(screen.getByText('Create New Escrow')).toBeTruthy();
    expect(screen.getByText('Launch Exchange Oracle')).toBeTruthy();
  });
});

it('LaunchSuccess component renders correctly, corresponds to the snapshot', () => {
  const client = setupClient({
    connectors: [new MockConnector({ options: { signer: getSigners()[0]! } })],
  });
  const tree = renderer
    .create(
      <Providers client={client}>
        <LaunchSuccess jobResponse={jobResponse} onCreateNewEscrow={() => 1} />
      </Providers>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
