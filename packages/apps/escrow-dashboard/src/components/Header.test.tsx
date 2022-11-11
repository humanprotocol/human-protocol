import React from 'react';
import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { act } from 'react-dom/test-utils';
import Header from 'src/components/Header';

describe('when rendered Header component', () => {
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

  it('should render `text` prop', async () => {
    await act(async () => {
      render(<Header />);
    });
    expect(screen.getByText(/HUMAN Website/)).toBeInTheDocument();
  });
});

it('Header component renders correctly, corresponds to the snapshot', () => {
  const tree = renderer.create(<Header />).toJSON();
  expect(tree).toMatchSnapshot();
});
