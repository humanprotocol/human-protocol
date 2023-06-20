import { Box, CircularProgress } from '@mui/material';
import { FC } from 'react';

import { NetworkSelect } from '../NetworkSelect';
import TimeRangeButtons from '../TimeRangeButtons';
import { ViewTitle } from '../ViewTitle';
import { EscrowView } from './EscrowView';

import networkSvg from 'src/assets/network.svg';
import { useAppDispatch } from 'src/state';
import {
  useChainId,
  useEscrowDataLoaded,
  usePollEventsData,
} from 'src/state/escrow/hooks';
import { setChainId as setEscrowChainId } from 'src/state/escrow/reducer';
import { setChainId as setLeaderChainId } from 'src/state/leader/reducer';

export const EscrowContainer: FC = () => {
  const chainId = useChainId();
  const dispatch = useAppDispatch();

  usePollEventsData();

  const dataLoaded = useEscrowDataLoaded();

  const handleChangeChain = (e: any) => {
    const id = e.target.value;
    dispatch(setEscrowChainId(id));
    dispatch(setLeaderChainId(id));
  };

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
        <ViewTitle title="Network" iconUrl={networkSvg} />
        <Box sx={{ ml: 'auto' }}>
          <NetworkSelect
            value={chainId}
            onChange={handleChangeChain}
            showAllNetwork
          />
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <TimeRangeButtons />
        </Box>
      </Box>
      {dataLoaded ? (
        <EscrowView />
      ) : (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress size={36} />
        </Box>
      )}
    </Box>
  );
};
