import { render, screen } from '@testing-library/react';
import { MockConnector } from '@wagmi/core/connectors/mock';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';
import { Providers, setupClient, getSigners } from '../../tests/utils';
import { JobRequest } from '../components/JobRequest';

describe('when rendered JobRequest component', () => {
  it('should render buttons', async () => {
    const client = setupClient({
      connectors: [
        new MockConnector({ options: { signer: getSigners()[0]! } }),
      ],
    });

    await act(async () => {
      render(
        <JobRequest
          fundingMethod="crypto"
          onBack={() => 1}
          onLaunch={() => 1}
          onSuccess={() => 1}
          onFail={() => 1}
        />,
        {
          wrapper: ({ children }: { children: React.ReactNode }) => (
            <Providers client={client}>{children}</Providers>
          ),
        }
      );
    });
    expect(screen.getByText('Fund and Request Job')).toBeTruthy();
    expect(screen.getByText('Back')).toBeTruthy();
  });
});

it('JobRequest component renders correctly, corresponds to the snapshot', () => {
  const client = setupClient({
    connectors: [new MockConnector({ options: { signer: getSigners()[0]! } })],
  });
  const tree = create(
    <Providers client={client}>
      <JobRequest
        fundingMethod="crypto"
        onBack={() => 1}
        onLaunch={() => 1}
        onSuccess={() => 1}
        onFail={() => 1}
      />
    </Providers>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
