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
    <Box id="network" mt={{ xs: 4, md: 8 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 4,
          mb: 4,
        }}
      >
        <ViewTitle title="HUMAN App data" iconUrl={networkSvg} />
        <Box sx={{ ml: 'auto' }}>
          <NetworkSelect
            value={ChainId.POLYGON_MUMBAI}
            supportedChainIds={[ChainId.POLYGON_MUMBAI]}
          />
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <TimeRangeButtons />
        </Box>
      </Box>
      <HumanAppDataView />
    </Box>
  );
};
