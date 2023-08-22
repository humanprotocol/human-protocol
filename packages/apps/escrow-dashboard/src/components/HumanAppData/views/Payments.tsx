import React, { useMemo, useState } from 'react';

import { ChartContainer } from './Container';
import { useHumanAppDataByChainId } from 'src/state/humanAppData/hooks';
import { EventDayData } from 'src/state/humanAppData/types';

enum PaymentStatus {
  HMT,
  Count,
  JobAverage,
  WorkerAverage,
}

const PAYMENT_STATUS_ITEMS = [
  { label: 'HMT', value: PaymentStatus.HMT },
  { label: 'Count', value: PaymentStatus.Count },
  { label: 'Job Average', value: PaymentStatus.JobAverage },
  { label: 'Worker Average', value: PaymentStatus.WorkerAverage },
];

export const PaymentsView = () => {
  const [status, setStatus] = useState(PaymentStatus.HMT);
  const eventDayDatas = useHumanAppDataByChainId();

  const seriesData = useMemo(() => {
    if (eventDayDatas) {
      const VALUES_BY_TYPE: Record<PaymentStatus, keyof EventDayData> = {
        [PaymentStatus.HMT]: 'dailyPayoutAmount',
        [PaymentStatus.Count]: 'dailyPayoutCount',
        [PaymentStatus.JobAverage]: 'dailyBulkPayoutEventCount',
        [PaymentStatus.WorkerAverage]: 'dailyBulkPayoutEventCount',
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
      title="Payments"
      items={PAYMENT_STATUS_ITEMS}
      onChange={(_status) => setStatus(_status)}
    />
  );
};
