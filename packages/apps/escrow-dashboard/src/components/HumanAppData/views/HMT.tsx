import { DailyHMTData } from '@human-protocol/sdk/dist/graphql';
import React, { useMemo, useState } from 'react';

import { ChartContainer } from './Container';
import { TooltipIcon } from 'src/components/TooltipIcon';
import { useHMTStatisticsByChainId } from 'src/state/humanAppData/hooks';

enum HMTStatus {
  Transactions,
  AmountTransfered,
}

const HMT_STATUS_ITEMS = [
  { label: 'Transactions', value: HMTStatus.Transactions },
  { label: 'Amount Transfered', value: HMTStatus.AmountTransfered },
];

export const HMTView = () => {
  const [status, setStatus] = useState(HMTStatus.Transactions);
  const data = useHMTStatisticsByChainId();

  const seriesData = useMemo(() => {
    if (data) {
      const VALUES_BY_TYPE: Record<HMTStatus, keyof DailyHMTData> = {
        [HMTStatus.Transactions]: 'totalTransactionCount',
        [HMTStatus.AmountTransfered]: 'totalTransactionAmount',
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
      title="HMT"
      items={HMT_STATUS_ITEMS}
      onChange={(_status) => setStatus(_status)}
    >
      <TooltipIcon title="Sorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim." />
    </ChartContainer>
  );
};
