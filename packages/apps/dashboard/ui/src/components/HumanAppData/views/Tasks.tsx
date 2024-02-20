import { ChainId } from '@human-protocol/sdk';
import React from 'react';

import { ChartContainer } from './Container';
import { TooltipIcon } from 'src/components/TooltipIcon';
import { TOOLTIPS } from 'src/constants/tooltips';
import { useChainId } from 'src/state/humanAppData/hooks';

export const TasksView = ({
  isLoading,
  data,
}: {
  isLoading: boolean;
  data: any[];
}) => {
  const chainId = useChainId();

  return (
    <ChartContainer
      isLoading={isLoading}
      data={data}
      title="Tasks"
      isNotSupportedChain={
        chainId !== ChainId.POLYGON && chainId !== ChainId.ALL
      }
    >
      <TooltipIcon title={TOOLTIPS.SOLVED_TASKS} />
    </ChartContainer>
  );
};
