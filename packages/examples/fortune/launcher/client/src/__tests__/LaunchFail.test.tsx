import * as React from 'react';
import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { act } from 'react-dom/test-utils';
import { LaunchFail } from 'src/components/LaunchFail';
import { Providers, setupClient, getSigners } from 'tests/utils';
import { MockConnector } from '@wagmi/core/connectors/mock';

describe('when rendered LaunchFail component', () => {
  it('should render texts', async () => {
    const client = setupClient({
      connectors: [
        new MockConnector({ options: { signer: getSigners()[0]! } }),
      ],
    });

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      render(<LaunchFail onBack={() => 1} />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers client={client}>{children}</Providers>
        ),
      });
    });
    expect(screen.getByText('Fail!')).toBeTruthy();
    expect(screen.getByText('Back')).toBeTruthy();
  });
});

it('LaunchFail component renders correctly, corresponds to the snapshot', () => {
  const client = setupClient({
    connectors: [new MockConnector({ options: { signer: getSigners()[0]! } })],
  });
  const tree = renderer
    .create(
      <Providers client={client}>
        <LaunchFail onBack={() => 1} />
      </Providers>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
