import React from 'react';
import { render } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { act } from 'react-dom/test-utils';
import Layout from 'src/components/Layout';

describe('when rendered Layout component', () => {
  beforeAll(async () => {
    global.fetch = jest.fn().mockImplementationOnce(() =>
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

  it('should render passed `children` prop', () => {
    act(() => {
      const { getByTestId } = render(
        <Layout>
          <div data-testid="root">
            <div data-testid="parent">
              <div data-testid="child">content</div>
            </div>
          </div>
        </Layout>
      );

      const root = getByTestId('root');
      const parent = getByTestId('parent');
      const child = getByTestId('child');
      expect(root).toContainElement(parent);
      expect(parent).toContainElement(child);
      expect(child).not.toContainElement(parent); // Pass
    });
  });
});

it('Layout component renders correctly, corresponds to the snapshot', () => {
  const tree = renderer
    .create(
      <Layout>
        <div data-testid="root">
          <div data-testid="parent">
            <div data-testid="child">content</div>
          </div>
        </div>
      </Layout>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
