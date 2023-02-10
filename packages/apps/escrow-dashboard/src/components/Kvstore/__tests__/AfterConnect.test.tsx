import React from 'react';
import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { act } from 'react-dom/test-utils';
import { AfterConnect } from 'src/components/Kvstore/AfterConnect';

describe('when rendered AfterConnect component', () => {
  it('should render `text` prop', async () => {
    await act(async () => {
      render(<AfterConnect />);
    });
    expect(screen.getByText(/ETH KV Store/)).toBeInTheDocument();
  });
});

it('AfterConnect component renders correctly, corresponds to the snapshot', () => {
  const tree = renderer.create(<AfterConnect />).toJSON();
  expect(tree).toMatchSnapshot();
});
