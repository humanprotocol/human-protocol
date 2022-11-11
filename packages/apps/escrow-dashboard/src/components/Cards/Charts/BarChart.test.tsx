import * as React from 'react';
import { render, screen } from '@testing-library/react';
import renderer from 'react-test-renderer';
import { act } from 'react-dom/test-utils';
import { CardBarChart } from 'src/components/Cards';

global.ResizeObserver = require('resize-observer-polyfill');

const mock = {
  title: 'Title',
  totalValue: 100,
  series: [
    { date: '23/09', value: 1 },
    { date: '24/09', value: 2 },
    { date: '25/09', value: 3 },
  ],
};

describe('when rendered CardBarChart component', () => {
  it('should render passed prop `title`', async () => {
    await act(() => {
      render(
        <CardBarChart
          title={mock.title}
          totalValue={mock.totalValue}
          series={mock.series}
        />
      );
    });
    expect(screen.findByLabelText(mock.title)).toBeTruthy();
  });

  it('should render passed prop `totalValue`', async () => {
    await act(() => {
      render(
        <CardBarChart
          title={mock.title}
          totalValue={mock.totalValue}
          series={mock.series}
        />
      );
    });
    expect(screen.findByLabelText(mock.totalValue)).toBeTruthy();
  });
});

it('CardBarChart component renders correctly, corresponds to the snapshot', () => {
  const tree = renderer
    .create(
      <CardBarChart
        title={mock.title}
        totalValue={mock.totalValue}
        series={mock.series}
      />
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
