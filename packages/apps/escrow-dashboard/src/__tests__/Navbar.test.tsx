import React from 'react';
import { render } from '@testing-library/react';
import renderer from 'react-test-renderer';
import Navbar from '../components/Navbar';

describe('when rendered Navbar component', () => {
  it('should paste it into the greetings text', () => {
    render(<Navbar />);
  });
});

it('Navbar component renders correctly, corresponds to the snapshot', () => {
  const tree = renderer.create(<Navbar />).toJSON();
  expect(tree).toMatchSnapshot();
});
