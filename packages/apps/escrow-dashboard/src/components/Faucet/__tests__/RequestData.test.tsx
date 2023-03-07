import React from 'react';
import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { act } from 'react-dom/test-utils';
import { RequestData } from '../RequestData';
import { MemoryRouter } from 'react-router-dom';
import { ChainId, ESCROW_NETWORKS } from '../../../constants';

describe('when rendered AfterConnect component', () => {
  it('should render `text` prop', async () => {
    await act(async () => {
      render(
        <RequestData network={ESCROW_NETWORKS[ChainId.POLYGON_MUMBAI]!} />,
        { wrapper: MemoryRouter }
      );
    });
    expect(screen.getByText(/Token address:/)).toBeInTheDocument();
  });
});

it('AfterConnect component renders correctly, corresponds to the snapshot', () => {
  const tree = renderer
    .create(
      <MemoryRouter>
        <RequestData network={ESCROW_NETWORKS[ChainId.POLYGON_MUMBAI]!} />
      </MemoryRouter>
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
