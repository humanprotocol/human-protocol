import React from 'react';
import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { act } from 'react-dom/test-utils';
import Header from 'src/components/Header';
import { vi } from 'vitest';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import {
  Providers,
  setupClient,
  getSigners,
  testChains,
} from '../../tests/utils';
import { MockConnector } from '@wagmi/core/connectors/mock';

describe('when rendered Header component', () => {
  beforeAll(async () => {
    global.fetch = vi.fn().mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        json: () =>
          Promise.resolve({
            market_data: {
              circulating_supply: 0,
              total_supply: 0,
              current_price: { usd: 0 },
              price_change_percentage_24h: 0,
            },
          }),
      })
    );
  });

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
      render(<Header />, {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Providers client={client}>
            <RainbowKitProvider chains={testChains} modalSize="compact">
              {children}
            </RainbowKitProvider>
          </Providers>
        ),
      });
    });
    expect(screen.getByText(/HUMAN Website/)).toBeInTheDocument();
  });
});

it('Header component renders correctly, corresponds to the snapshot', () => {
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
  const tree = renderer
    .create(
      <Providers client={client}>
        <RainbowKitProvider chains={testChains} modalSize="compact">
          <Header />
        </RainbowKitProvider>
      </Providers>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
