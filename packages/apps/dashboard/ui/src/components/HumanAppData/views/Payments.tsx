import React from 'react';

import { ChartContainer } from './Container';
import { TooltipIcon } from 'src/components/TooltipIcon';
import { TOOLTIPS } from 'src/constants/tooltips';

export const PaymentsView = ({
  isLoading,
  data,
}: {
  isLoading: boolean;
  data: any[];
}) => {
  return (
    <ChartContainer isLoading={isLoading} data={data} title="Payments">
      <TooltipIcon title={TOOLTIPS.PAYMENTS} />
    </ChartContainer>
  );
};
