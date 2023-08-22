import React, { useMemo, useState } from 'react';

import { ChartContainer } from './Container';
import { useHumanAppDataByChainId } from 'src/state/humanAppData/hooks';
import { EventDayData } from 'src/state/humanAppData/types';

enum TaskStatus {
  Total = 'Total',
  Pending = 'Pending',
  Solved = 'Solved',
  Paid = 'Paid',
  Cancelled = 'Cancelled',
}

const TASK_STATUS_ITEMS = [
  { label: 'Total', value: TaskStatus.Total },
  { label: 'Pending', value: TaskStatus.Pending },
  { label: 'Solved', value: TaskStatus.Solved },
  { label: 'Paid', value: TaskStatus.Paid },
  { label: 'Cancelled', value: TaskStatus.Cancelled },
];

export const TasksView = () => {
  const [status, setStatus] = useState(TaskStatus.Total);
  const eventDayDatas = useHumanAppDataByChainId();

  const seriesData = useMemo(() => {
    if (eventDayDatas) {
      const VALUES_BY_TYPE: Record<TaskStatus, keyof EventDayData> = {
        [TaskStatus.Total]: 'dailyEscrowCount',
        [TaskStatus.Pending]: 'dailyPendingStatusEventCount',
        [TaskStatus.Solved]: 'dailyBulkPayoutEventCount',
        [TaskStatus.Paid]: 'dailyPaidStatusEventCount',
        [TaskStatus.Cancelled]: 'dailyCancelledStatusEventCount',
      };
      return eventDayDatas
        .map((d) => ({
          date: d.timestamp * 1000,
          value: Number(d[VALUES_BY_TYPE[status]]),
        }))
        .reverse();
    }
    return [];
  }, [eventDayDatas, status]);

  return (
    <ChartContainer
      data={seriesData}
      title="Tasks"
      items={TASK_STATUS_ITEMS}
      onChange={(_status) => setStatus(_status)}
    />
  );
};
