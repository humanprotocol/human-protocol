import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { create } from 'react-test-renderer';

import { BarChart } from './BarChart';

const mock = {
  title: 'Title',
  totalValue: 100,
  series: [
    { date: '23/09', value: 1 },
    { date: '24/09', value: 2 },
    { date: '25/09', value: 3 },
  ],
};

describe('when rendered BarChart component', () => {
  it('should render passed prop `title`', async () => {
    await act(() => {
      render(
        <BarChart
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
        <BarChart
          title={mock.title}
          totalValue={mock.totalValue}
          series={mock.series}
        />
      );
    });
    expect(screen.findByLabelText(mock.totalValue)).toBeTruthy();
  });
});

it('BarChart component renders correctly, corresponds to the snapshot', () => {
  const tree = create(
    <BarChart
      title={mock.title}
      totalValue={mock.totalValue}
      series={mock.series}
    />
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
