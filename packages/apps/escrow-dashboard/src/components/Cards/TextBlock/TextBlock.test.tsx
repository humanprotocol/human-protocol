import * as React from 'react';
import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { CardTextBlock } from 'src/components/Cards';

const mock = {
  value: 'Value',
  title: 'Title',
};

describe('when rendered CardBarChart component', () => {
  it('should render passed prop `value`', () => {
    render(<CardTextBlock value={mock.value} title={mock.title} />);
    expect(screen.findByLabelText(mock.value)).toBeTruthy();
  });

  it('should render passed prop `title`', () => {
    render(<CardTextBlock value={mock.value} title={mock.title} />);
    expect(screen.findByLabelText(mock.title)).toBeTruthy();
  });
});

it('CardTextBlock component renders correctly, corresponds to the snapshot', () => {
  const tree = renderer
    .create(<CardTextBlock value={mock.value} title={mock.title} />)
    .toJSON();
  expect(tree).toMatchSnapshot();
});
