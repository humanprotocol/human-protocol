import { ChainId } from '@human-protocol/sdk';
import React, { useMemo } from 'react';

import { ChartContainer } from './Container';
import { TooltipIcon } from 'src/components/TooltipIcon';
import { useTaskStats } from 'src/hooks/useTaskStats';
import { useChainId } from 'src/state/humanAppData/hooks';

export const TasksView = () => {
  const chainId = useChainId();
  const { data, isLoading } = useTaskStats();

  const seriesData = useMemo(() => {
    if (data) {
      return data.map((d) => ({
        date: d.timestamp,
        value: Number(d.escrowsTotal),
      }));
    }
    return [];
  }, [data]);

  return (
    <ChartContainer
      isLoading={isLoading}
      data={seriesData}
      isNotSupportedChain={chainId !== ChainId.POLYGON}
      title="Tasks"
    >
      <TooltipIcon title="Sorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim." />
    </ChartContainer>
  );
};
