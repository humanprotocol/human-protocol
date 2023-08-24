import React, { useMemo, useState } from 'react';

import { ChartContainer } from './Container';
import { TooltipIcon } from 'src/components/TooltipIcon';
import { useHumanAppDataByChainId } from 'src/state/humanAppData/hooks';
import { EventDayData } from 'src/state/humanAppData/types';

enum HMTStatus {
  // Holders,
  Transactions,
  AmountTransfered,
}

const HMT_STATUS_ITEMS = [
  // { label: 'Holders', value: HMTStatus.Holders },
  { label: 'Transactions', value: HMTStatus.Transactions },
  { label: 'Amount Transfered', value: HMTStatus.AmountTransfered },
];

export const HMTView = () => {
  const [status, setStatus] = useState(HMTStatus.Transactions);
  const eventDayDatas = useHumanAppDataByChainId();

  const seriesData = useMemo(() => {
    if (eventDayDatas) {
      const VALUES_BY_TYPE: Record<HMTStatus, keyof EventDayData> = {
        // [HMTStatus.Holders]: 'dailyEscrowCount',
        [HMTStatus.Transactions]: 'dailyHMTTransferCount',
        [HMTStatus.AmountTransfered]: 'dailyHMTTransferAmount',
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
      title="HMT"
      items={HMT_STATUS_ITEMS}
      onChange={(_status) => setStatus(_status)}
    >
      <TooltipIcon title="Sorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim." />
    </ChartContainer>
  );
};
