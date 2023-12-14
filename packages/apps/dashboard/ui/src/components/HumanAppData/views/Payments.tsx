import React from 'react';

import { ChartContainer } from './Container';
import { TooltipIcon } from 'src/components/TooltipIcon';

export const PaymentsView = ({
  isLoading,
  data,
}: {
  isLoading: boolean;
  data: any[];
}) => {
  return (
    <ChartContainer isLoading={isLoading} data={data} title="Payments">
      <TooltipIcon title="Sorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim." />
    </ChartContainer>
  );
};
