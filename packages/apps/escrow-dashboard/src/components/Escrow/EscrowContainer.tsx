import { Box, CircularProgress } from '@mui/material';
import { FC } from 'react';
import { useSwitchNetwork } from 'wagmi';

import { NetworkSelect } from '../NetworkSelect';
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
  const { switchNetwork } = useSwitchNetwork();

  usePollEventsData();

  const dataLoaded = useEscrowDataLoaded();

  const handleChangeChain = (e: any) => {
    const id = e.target.value;
    dispatch(setEscrowChainId(id));
    dispatch(setLeaderChainId(id));

    switchNetwork?.(id);
  };

  return (
    <Box id="network" mt={{ xs: 4, md: 8 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: { xs: '12px', sm: '18px', md: '26px', lg: '32px', xl: '44px' },
        }}
      >
        <ViewTitle title="Network" iconUrl={networkSvg} />
        <NetworkSelect
          value={chainId}
          onChange={handleChangeChain}
          showAllNetwork
        />
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
