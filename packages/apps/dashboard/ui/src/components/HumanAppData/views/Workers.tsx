import { ChainId } from '@human-protocol/sdk';
import React, { useMemo } from 'react';

import { ChartContainer } from './Container';
import { TooltipIcon } from 'src/components/TooltipIcon';
import { TOOLTIPS } from 'src/constants/tooltips';
import { useWorkerStats } from 'src/hooks/useWorkerStats';
import { useChainId, useDays } from 'src/state/humanAppData/hooks';

export const WorkersView = () => {
  const days = useDays();
  const chainId = useChainId();
  const { data, isLoading } = useWorkerStats();

  const seriesData = useMemo(() => {
    if (data) {
      return [...data.dailyWorkersData].slice(-days).map((d: any) => ({
        date: d.timestamp,
        value: Number(d.activeWorkers),
      }));
    }
    return [];
  }, [data, days]);

  return (
    <ChartContainer
      isLoading={isLoading}
      data={seriesData}
      title="Workers"
      isNotSupportedChain={chainId !== ChainId.POLYGON}
    >
      <TooltipIcon title={TOOLTIPS.WORKERS} />
    </ChartContainer>
  );
};
