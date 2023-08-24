import React, { useMemo, useState } from 'react';

import { ChartContainer } from './Container';
import { TooltipIcon } from 'src/components/TooltipIcon';
import { useHumanAppDataByChainId } from 'src/state/humanAppData/hooks';
import { EventDayData } from 'src/state/humanAppData/types';

enum WorkerStatus {
  TotalWorkers,
  ActiveWorkers,
  AverageJobsSolved,
}

const WORKER_STATUS_ITEMS = [
  { label: 'Total workers', value: WorkerStatus.TotalWorkers },
  { label: 'Active workers', value: WorkerStatus.ActiveWorkers },
  { label: 'Average jobs solved', value: WorkerStatus.AverageJobsSolved },
];

export const WorkersView = () => {
  const [status, setStatus] = useState(WorkerStatus.TotalWorkers);
  const eventDayDatas = useHumanAppDataByChainId();

  const seriesData = useMemo(() => {
    if (eventDayDatas) {
      const VALUES_BY_TYPE: Record<WorkerStatus, keyof EventDayData> = {
        [WorkerStatus.TotalWorkers]: 'dailyWorkerCount',
        [WorkerStatus.ActiveWorkers]: 'dailyPendingStatusEventCount',
        [WorkerStatus.AverageJobsSolved]: 'dailyBulkPayoutEventCount',
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
      title="Workers"
      items={WORKER_STATUS_ITEMS}
      onChange={(_status) => setStatus(_status)}
    >
      <TooltipIcon title="Sorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim." />
    </ChartContainer>
  );
};
