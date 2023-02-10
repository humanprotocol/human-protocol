import React from 'react';
import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { act } from 'react-dom/test-utils';
import { Dashboard } from 'src/components/Kvstore/Dashboard';

describe('when rendered Dashboard component', () => {
  it('should render `text` prop', async () => {
    await act(async () => {
      render(<Dashboard publicKey="" />);
    });
    expect(screen.getByText(/ETH KV Store/)).toBeInTheDocument();
  });
});

it('Dashboard component renders correctly, corresponds to the snapshot', () => {
  const tree = renderer.create(<Dashboard publicKey="" />).toJSON();
  expect(tree).toMatchSnapshot();
});
