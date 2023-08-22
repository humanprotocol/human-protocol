import { ChainId } from '@human-protocol/sdk';
import { Box } from '@mui/material';
import { FC } from 'react';

import { NetworkSelect } from '../NetworkSelect';
import TimeRangeButtons from '../TimeRangeButtons';
import { ViewTitle } from '../ViewTitle';
import { HumanAppDataView } from './HumanAppDataView';
import networkSvg from 'src/assets/network.svg';
import { useHumanAppData } from 'src/state/humanAppData/hooks';

export const HumanAppDataContainer: FC = () => {
  useHumanAppData();

  return (
    <Box id="human-app-data" mt={{ xs: 4, md: 8 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          justifyContent: { xs: 'flex-start', lg: 'space-between' },
          alignItems: { xs: 'flex-start', lg: 'center' },
          gap: 4,
          mb: 4,
        }}
      >
        <ViewTitle title="HUMAN App data" iconUrl={networkSvg} />
        <Box sx={{ width: '100%', maxWidth: { xs: '100%', lg: '513px' } }}>
          <NetworkSelect
            value={ChainId.POLYGON_MUMBAI}
            supportedChainIds={[ChainId.POLYGON_MUMBAI]}
            width="100%"
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
