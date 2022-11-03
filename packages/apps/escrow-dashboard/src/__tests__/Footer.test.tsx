import * as React from 'react';
import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import Footer from '../components/Footer';

const mock = {
  link: 'https://github.com/humanprotocol/hmt-escrow',
  text: 'Terms and conditions',
};

describe('when rendered Footer component', () => {
  it('should render `text` prop', () => {
    render(<Footer />);
    expect(screen.getByText(mock.text)).toBeTruthy();
  });

  // it('should render prop `link` to /https://github.com/humanprotocol/hmt-escrow', () => {
  //   render(<Footer />);
  //   expect(screen.getByText(mock.text).href).toBe(mock.link);
  // });
});

it('Footer component renders correctly, corresponds to the snapshot', () => {
  const tree = renderer.create(<Footer />).toJSON();
  expect(tree).toMatchSnapshot();
});
