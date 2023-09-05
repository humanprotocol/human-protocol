import { ChainId } from '@human-protocol/sdk';
import { Box, CircularProgress } from '@mui/material';
import { FC } from 'react';

import { NetworkSelect } from '../NetworkSelect';
import TimeRangeButtons from '../TimeRangeButtons';
import { ViewTitle } from '../ViewTitle';
import { HumanAppDataView } from './HumanAppDataView';
import networkSvg from 'src/assets/network.svg';
import { V2_SUPPORTED_CHAIN_IDS } from 'src/constants';
import {
  useHumanAppData,
  useHumanAppDataLoaded,
} from 'src/state/humanAppData/hooks';

export const HumanAppDataContainer: FC = () => {
  useHumanAppData();

  const loaded = useHumanAppDataLoaded();

  return (
    <Box id="human-app-data" mt={{ xs: '44px', md: '51px' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          justifyContent: { xs: 'flex-start', lg: 'space-between' },
          alignItems: { xs: 'flex-start', lg: 'center' },
          gap: 4,
          mb: '40px',
          px: { xs: 0, xl: '12px' },
        }}
      >
        <ViewTitle title="HUMAN App data" iconUrl={networkSvg} />
        <Box sx={{ width: '100%', maxWidth: { xs: '100%', lg: '513px' } }}>
          <NetworkSelect
            value={ChainId.POLYGON_MUMBAI}
            supportedChainIds={V2_SUPPORTED_CHAIN_IDS}
            width="100%"
          />
        </Box>
        <Box sx={{ width: '100%', maxWidth: { xs: '100%', lg: '368px' } }}>
          <TimeRangeButtons fullWidth />
        </Box>
      </Box>
      {loaded ? (
        <HumanAppDataView />
      ) : (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress size={36} />
        </Box>
      )}
    </Box>
  );
};
