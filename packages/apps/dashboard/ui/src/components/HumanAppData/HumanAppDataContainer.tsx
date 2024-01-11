import { Box } from '@mui/material';
import { FC } from 'react';

import { NetworkSelect } from '../NetworkSelect';
import TimeRangeButtons from '../TimeRangeButtons';
import { ViewTitle } from '../ViewTitle';
import { HumanAppDataView } from './HumanAppDataView';
import networkSvg from 'src/assets/network.svg';
import { V2_SUPPORTED_CHAIN_IDS } from 'src/constants';
import { useAppDispatch } from 'src/state';
import { useChainId } from 'src/state/humanAppData/hooks';
import { setChainId } from 'src/state/humanAppData/reducer';

export const HumanAppDataContainer: FC = () => {
  const dispatch = useAppDispatch();

  const chainId = useChainId();

  const handleNetworkChange = (e: any) => {
    dispatch(setChainId(e.target.value));
  };

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
            value={chainId}
            showAllNetwork
            supportedChainIds={V2_SUPPORTED_CHAIN_IDS}
            width="100%"
            onChange={handleNetworkChange}
          />
        </Box>
        <Box sx={{ width: '100%', maxWidth: { xs: '100%', lg: '368px' } }}>
          <TimeRangeButtons fullWidth />
        </Box>
      </Box>
      <HumanAppDataView />
    </Box>
  );
};
