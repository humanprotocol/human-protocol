import { DailyEscrowData } from '@human-protocol/sdk/dist/graphql';
import React, { useMemo, useState } from 'react';

import { ChartContainer } from './Container';
import { TooltipIcon } from 'src/components/TooltipIcon';
import { useEscrowStatisticsByChainId } from 'src/state/humanAppData/hooks';

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
  const data = useEscrowStatisticsByChainId();

  const seriesData = useMemo(() => {
    if (data) {
      const VALUES_BY_TYPE: Record<TaskStatus, keyof DailyEscrowData> = {
        [TaskStatus.Total]: 'escrowsTotal',
        [TaskStatus.Pending]: 'escrowsPending',
        [TaskStatus.Solved]: 'escrowsSolved',
        [TaskStatus.Paid]: 'escrowsPaid',
        [TaskStatus.Cancelled]: 'escrowsCancelled',
      };
      return data.map((d) => ({
        date: d.timestamp,
        value: Number(d[VALUES_BY_TYPE[status]]),
      }));
    }
    return [];
  }, [data, status]);

  return (
    <ChartContainer
      data={seriesData}
      title="Tasks"
      items={TASK_STATUS_ITEMS}
      onChange={(_status) => setStatus(_status)}
    >
      <TooltipIcon title="Sorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim." />
    </ChartContainer>
  );
};
