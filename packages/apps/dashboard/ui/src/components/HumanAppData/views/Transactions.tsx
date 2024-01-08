import React from 'react';

import { ChartContainer } from './Container';
import { TooltipIcon } from 'src/components/TooltipIcon';
import { TOOLTIPS } from 'src/constants/tooltips';

export const TransactionsView = ({
  isLoading,
  data,
}: {
  isLoading: boolean;
  data: any[];
}) => {
  return (
    <ChartContainer isLoading={isLoading} data={data} title="Transactions">
      <TooltipIcon title={TOOLTIPS.TRANSACTIONS} />
    </ChartContainer>
  );
};
