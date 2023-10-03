import React, { useMemo } from 'react';

import { ChartContainer } from './Container';
import { TooltipIcon } from 'src/components/TooltipIcon';
import { usePaymentStats } from 'src/hooks/usePaymentStats';
import { useDays } from 'src/state/humanAppData/hooks';

export const PaymentsView = () => {
  const days = useDays();
  const { data, isLoading } = usePaymentStats();

  const seriesData = useMemo(() => {
    if (data) {
      return data.dailyPaymentsData
        .slice(0, days)
        .reverse()
        .map((d: any) => ({
          date: d.timestamp,
          value: Number(d.totalAmountPaid),
        }));
    }
    return [];
  }, [data]);

  return (
    <ChartContainer isLoading={isLoading} data={seriesData} title="Payments">
      <TooltipIcon title="Sorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim." />
    </ChartContainer>
  );
};
