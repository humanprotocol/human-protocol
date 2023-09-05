import { DailyPaymentData } from '@human-protocol/sdk/dist/graphql';
import React, { useMemo, useState } from 'react';

import { ChartContainer } from './Container';
import { TooltipIcon } from 'src/components/TooltipIcon';
import { usePaymentStatisticsByChainId } from 'src/state/humanAppData/hooks';

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
  const data = usePaymentStatisticsByChainId();

  const seriesData = useMemo(() => {
    if (data) {
      const VALUES_BY_TYPE: Record<PaymentStatus, keyof DailyPaymentData> = {
        [PaymentStatus.HMT]: 'totalAmountPaid',
        [PaymentStatus.Count]: 'totalCount',
        [PaymentStatus.JobAverage]: 'averageAmountPerJob',
        [PaymentStatus.WorkerAverage]: 'averageAmountPerWorker',
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
      title="Payments"
      items={PAYMENT_STATUS_ITEMS}
      onChange={(_status) => setStatus(_status)}
    >
      <TooltipIcon title="Sorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim." />
    </ChartContainer>
  );
};
