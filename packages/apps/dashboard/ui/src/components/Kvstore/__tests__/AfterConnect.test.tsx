import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';

import { AfterConnect, AfterConnectProps } from '../AfterConnect';

describe('when rendered AfterConnect component', () => {
  it('should render `text` prop', async () => {
    await act(async () => {
      render(<AfterConnect {...({} as AfterConnectProps)} />);
    });
    expect(screen.getByText(/ETH KV Store/)).toBeInTheDocument();
  });
});

it('AfterConnect component renders correctly, corresponds to the snapshot', () => {
  const tree = create(<AfterConnect {...({} as AfterConnectProps)} />).toJSON();
  expect(tree).toMatchSnapshot();
});
