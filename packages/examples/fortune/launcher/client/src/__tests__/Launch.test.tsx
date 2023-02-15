import * as React from 'react';
import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { act } from 'react-dom/test-utils';
import { Launch } from 'src/components/Launch';
import { Providers, setupClient, getSigners } from 'tests/utils';
import { MockConnector } from '@wagmi/core/connectors/mock';

describe('when rendered Launch component', () => {
  it('should render texts', async () => {
    const client = setupClient({
      connectors: [
        new MockConnector({ options: { signer: getSigners()[0]! } }),
      ],
    });

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      render(<Launch />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers client={client}>{children}</Providers>
        ),
      });
    });
    expect(screen.getByText('Creating Job')).toBeTruthy();
    expect(screen.getByText('Setting Up Escrow')).toBeTruthy();
    expect(screen.getByText('Funding Escrow')).toBeTruthy();
    expect(screen.getByText('Setting Up Trusted Handler')).toBeTruthy();
  });
});

it('Launch component renders correctly, corresponds to the snapshot', () => {
  const client = setupClient({
    connectors: [new MockConnector({ options: { signer: getSigners()[0]! } })],
  });
  const tree = renderer
    .create(
      <Providers client={client}>
        <Launch />
      </Providers>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
