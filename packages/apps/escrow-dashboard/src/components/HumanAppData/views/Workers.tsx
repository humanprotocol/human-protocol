import { DailyWorkerData } from '@human-protocol/sdk/dist/graphql';
import React, { useMemo, useState } from 'react';

import { ChartContainer } from './Container';
import { TooltipIcon } from 'src/components/TooltipIcon';
import { useWokerStatisticsByChainId } from 'src/state/humanAppData/hooks';

enum WorkerStatus {
  // TotalWorkers,
  ActiveWorkers,
  AverageJobsSolved,
}

const WORKER_STATUS_ITEMS = [
  // { label: 'Total workers', value: WorkerStatus.TotalWorkers },
  { label: 'Active workers', value: WorkerStatus.ActiveWorkers },
  { label: 'Average jobs solved', value: WorkerStatus.AverageJobsSolved },
];

export const WorkersView = () => {
  const [status, setStatus] = useState(WorkerStatus.ActiveWorkers);
  const data = useWokerStatisticsByChainId();

  const seriesData = useMemo(() => {
    if (data) {
      const VALUES_BY_TYPE: Record<WorkerStatus, keyof DailyWorkerData> = {
        // [WorkerStatus.TotalWorkers]: 'dailyWorkerCount',
        [WorkerStatus.ActiveWorkers]: 'activeWorkers',
        [WorkerStatus.AverageJobsSolved]: 'averageJobsSolved',
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
      title="Workers"
      items={WORKER_STATUS_ITEMS}
      onChange={(_status) => setStatus(_status)}
    >
      <TooltipIcon title="Sorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim." />
    </ChartContainer>
  );
};
