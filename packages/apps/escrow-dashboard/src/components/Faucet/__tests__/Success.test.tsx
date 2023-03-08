import React from 'react';
import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { act } from 'react-dom/test-utils';
import { Success } from '../Success';
import { MemoryRouter } from 'react-router-dom';

describe('when rendered Success component', () => {
  it('should render `text` prop', async () => {
    await act(async () => {
      render(<Success />, { wrapper: MemoryRouter });
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
  const tree = renderer
    .create(
      <MemoryRouter>
        <Success />
      </MemoryRouter>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
