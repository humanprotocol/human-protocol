import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { create } from 'react-test-renderer';

import { Success, SuccessProps } from '../Success';

describe('when rendered Success component', () => {
  it('should render `text` prop', async () => {
    await act(async () => {
      render(<Success {...({} as SuccessProps)} />, { wrapper: MemoryRouter });
    });
    expect(screen.getByText(/Request Complete!/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Congratulations, 10 testnet HMT was sent to your account/
      )
    ).toBeInTheDocument();
  });
});

it('Success component renders correctly, corresponds to the snapshot', () => {
  const tree = create(
    <MemoryRouter>
      <Success {...({} as SuccessProps)} />
    </MemoryRouter>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
