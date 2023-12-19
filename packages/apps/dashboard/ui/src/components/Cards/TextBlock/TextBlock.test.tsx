import { render, screen } from '@testing-library/react';
import { create } from 'react-test-renderer';

import { TextBlock } from './TextBlock';

const mock = {
  value: 'Value',
  title: 'Title',
};

describe('when rendered CardBarChart component', () => {
  it('should render passed prop `value`', () => {
    render(<TextBlock value={mock.value} title={mock.title} />);
    expect(screen.findByLabelText(mock.value)).toBeTruthy();
  });

  it('should render passed prop `title`', () => {
    render(<TextBlock value={mock.value} title={mock.title} />);
    expect(screen.findByLabelText(mock.title)).toBeTruthy();
  });
});

it('TextBlock component renders correctly, corresponds to the snapshot', () => {
  const tree = create(
    <TextBlock value={mock.value} title={mock.title} />
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
