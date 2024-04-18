import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { create } from 'react-test-renderer';
import { RequestData, RequestDataProps } from '../RequestData';

describe('when rendered AfterConnect component', () => {
  it('should render `text` prop', async () => {
    await act(async () => {
      render(
        <RequestData
          {...({} as RequestDataProps)}
          network={NETWORKS[ChainId.POLYGON_AMOY]!}
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
        network={NETWORKS[ChainId.POLYGON_AMOY]!}
      />
    </MemoryRouter>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
