import { render, screen } from '@testing-library/react';
import { MockConnector } from '@wagmi/core/connectors/mock';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';
import { Providers, setupClient, getSigners } from '../../tests/utils';
import { Launch } from '../components/Launch';

describe('when rendered Launch component', () => {
  it('should render texts', async () => {
    const client = setupClient({
      connectors: [
        new MockConnector({ options: { signer: getSigners()[0]! } }),
      ],
    });

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
  const tree = create(
    <Providers client={client}>
      <Launch />
    </Providers>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
