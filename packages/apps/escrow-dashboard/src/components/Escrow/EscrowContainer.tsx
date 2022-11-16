import React, { useState } from 'react';
import { Box, CircularProgress, Tab, Tabs } from '@mui/material';
import ViewTitle from 'src/components/ViewTitle';
import { ChainId, ESCROW_NETWORKS, SUPPORTED_CHAIN_IDS } from 'src/constants';
import { useEscrowDataLoaded, usePollEventsData } from 'src/state/escrow/hooks';

import { EscrowView } from './EscrowView';

interface IEscrowContainer {}

export const EscrowContainer: React.FC<IEscrowContainer> = (): React.ReactElement => {
  const [chainId, setChainId] = useState<ChainId>(ChainId.ALL);
  usePollEventsData();

  const dataLoaded = useEscrowDataLoaded();

  return (
    <Box id="network">
      <ViewTitle title="Network" iconUrl="/images/network.svg" />
      <Tabs
        sx={{
          my: { xs: '12px', sm: '18px', md: '26px', lg: '32px', xl: '44px' },
        }}
        value={chainId}
        onChange={(e, id) => setChainId(id)}
      >
        <Tab value={ChainId.ALL} label="All Networks" />
        {SUPPORTED_CHAIN_IDS.map((chainId) => (
          <Tab
            key={chainId}
            value={chainId}
            label={ESCROW_NETWORKS[chainId]?.title}
          />
        ))}
      </Tabs>
      {dataLoaded ? (
        <EscrowView chainId={chainId} />
      ) : (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress size={36} />
        </Box>
      )}
    </Box>
  );
};
