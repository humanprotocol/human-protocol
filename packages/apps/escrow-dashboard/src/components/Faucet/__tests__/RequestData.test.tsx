import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { create } from 'react-test-renderer';

import { RequestData, RequestDataProps } from '../RequestData';

import { ChainId, ESCROW_NETWORKS } from 'src/constants';

describe('when rendered AfterConnect component', () => {
  it('should render `text` prop', async () => {
    await act(async () => {
      render(
        <RequestData
          {...({} as RequestDataProps)}
          network={ESCROW_NETWORKS[ChainId.POLYGON_MUMBAI]!}
        />,
        { wrapper: MemoryRouter }
      );
    });
    expect(screen.getByText(/Token address:/)).toBeInTheDocument();
  });
});

it('AfterConnect component renders correctly, corresponds to the snapshot', () => {
  const tree = create(
    <MemoryRouter>
      <RequestData
        {...({} as RequestDataProps)}
        network={ESCROW_NETWORKS[ChainId.POLYGON_MUMBAI]!}
      />
    </MemoryRouter>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
