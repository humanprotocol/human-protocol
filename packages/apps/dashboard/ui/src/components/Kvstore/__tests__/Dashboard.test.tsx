import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';

import { Dashboard, DashboardProps } from '../Dashboard';

describe('when rendered Dashboard component', () => {
  it('should render `text` prop', async () => {
    await act(async () => {
      render(<Dashboard {...({ publicKey: '' } as DashboardProps)} />);
    });
    expect(screen.getByText(/ETH KV Store/)).toBeInTheDocument();
  });
});

it('Dashboard component renders correctly, corresponds to the snapshot', () => {
  const tree = create(
    <Dashboard {...({ publicKey: '' } as DashboardProps)} />
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
