import * as React from 'react';
import { Box } from '@mui/material';

import ViewTitle from 'src/components/ViewTitle';

import { EscrowView } from './EscrowView';
import { NetworkTab } from './NetworkTab';

interface IEscrowContainer {}

export const EscrowContainer: React.FC<
  IEscrowContainer
> = (): React.ReactElement => {
  return (
    <Box id="network">
      <ViewTitle title="Network" iconUrl="/images/network.svg" />
      <NetworkTab />
      <EscrowView />
    </Box>
  );
};
