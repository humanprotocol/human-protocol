import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { create } from 'react-test-renderer';

import { FaucetView } from '../FaucetView';

describe('when rendered AfterConnect component', () => {
  it('should render `text` prop', async () => {
    await act(async () => {
      render(<FaucetView />, { wrapper: MemoryRouter });
    });
    expect(screen.getByText(/HUMAN Faucet for testnet/)).toBeInTheDocument();
  });
});

it('AfterConnect component renders correctly, corresponds to the snapshot', () => {
  const tree = create(
    <MemoryRouter>
      <FaucetView />
    </MemoryRouter>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
