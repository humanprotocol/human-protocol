import React, { useMemo } from 'react';

import { ChartContainer } from './Container';
import { TooltipIcon } from 'src/components/TooltipIcon';
import { useHMTStats } from 'src/hooks/useHMTStats';
import { useDays } from 'src/state/humanAppData/hooks';

export const TransactionsView = () => {
  const days = useDays();
  const { data, isLoading } = useHMTStats();

  const seriesData = useMemo(() => {
    if (data) {
      return data.dailyHMTData
        .slice(0, days)
        .reverse()
        .map((d) => ({
          date: d.timestamp,
          value: Number(d.totalTransactionCount),
        }));
    }
    return [];
  }, [data, days]);

  return (
    <ChartContainer
      isLoading={isLoading}
      data={seriesData}
      title="Transactions"
    >
      <TooltipIcon title="Sorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim." />
    </ChartContainer>
  );
};
