import { ChainId } from '@human-protocol/sdk';
import React, { useMemo } from 'react';

import { ChartContainer } from './Container';
import { TooltipIcon } from 'src/components/TooltipIcon';
import { TOOLTIPS } from 'src/constants/tooltips';
import { useTaskStats } from 'src/hooks/useTaskStats';
import { useChainId, useDays } from 'src/state/humanAppData/hooks';

export const TasksView = () => {
  const days = useDays();
  const chainId = useChainId();
  const { data, isLoading } = useTaskStats();

  const seriesData = useMemo(() => {
    if (data) {
      const cumulativeDailyTasksData = [...data.dailyTasksData]
        .map((d) => ({
          date: d.timestamp,
          value: Number(d.tasksSolved),
        }))
        .reduce((acc, d) => {
          acc.push({
            date: d.date,
            value: acc.length ? acc[acc.length - 1].value + d.value : d.value,
          });
          return acc;
        }, [] as any[]);

      return cumulativeDailyTasksData.slice(-days);
    }
    return [];
  }, [data, days]);

  return (
    <ChartContainer
      isLoading={isLoading}
      data={seriesData}
      isNotSupportedChain={
        chainId !== ChainId.POLYGON && chainId !== ChainId.ALL
      }
      title="Tasks"
    >
      <TooltipIcon title={TOOLTIPS.TASKS} />
    </ChartContainer>
  );
};
