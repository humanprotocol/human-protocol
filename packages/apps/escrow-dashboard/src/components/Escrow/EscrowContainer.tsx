import {
  Box,
  CircularProgress,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { FC, ReactElement } from 'react';
import { useSwitchNetwork } from 'wagmi';

import {
  BinanceSmartChainIcon,
  EthereumIcon,
  HumanIcon,
  MoonbeamIcon,
  PolygonIcon,
} from '../Icons';
import { ViewTitle } from '../ViewTitle';
import { EscrowView } from './EscrowView';

import networkSvg from 'src/assets/network.svg';
import { ChainId, ESCROW_NETWORKS, SUPPORTED_CHAIN_IDS } from 'src/constants';
import { useAppDispatch } from 'src/state';
import {
  useChainId,
  useEscrowDataLoaded,
  usePollEventsData,
} from 'src/state/escrow/hooks';
import { setChainId as setEscrowChainId } from 'src/state/escrow/reducer';
import { setChainId as setLeaderChainId } from 'src/state/leader/reducer';

const NETWORK_ICONS: { [chainId in ChainId]?: ReactElement } = {
  [ChainId.MAINNET]: <EthereumIcon />,
  [ChainId.RINKEBY]: <EthereumIcon />,
  [ChainId.GOERLI]: <EthereumIcon />,
  [ChainId.POLYGON]: <PolygonIcon />,
  [ChainId.POLYGON_MUMBAI]: <PolygonIcon />,
  [ChainId.BSC_MAINNET]: <BinanceSmartChainIcon />,
  [ChainId.BSC_TESTNET]: <BinanceSmartChainIcon />,
  [ChainId.MOONBEAM]: <MoonbeamIcon />,
};

export const EscrowContainer: FC = () => {
  const chainId = useChainId();
  const dispatch = useAppDispatch();
  const { switchNetwork } = useSwitchNetwork();

  usePollEventsData();

  const dataLoaded = useEscrowDataLoaded();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleChangeChain = (_e: React.SyntheticEvent, id: ChainId) => {
    dispatch(setEscrowChainId(id));
    dispatch(setLeaderChainId(id));

    switchNetwork?.(id);
  };

  return (
    <Box id="network" mt={{ xs: 4, md: 8 }}>
      <ViewTitle title="Network" iconUrl={networkSvg} />
      <Tabs
        sx={{
          borderBottom: '1px solid #858EC6',
          my: { xs: '12px', sm: '18px', md: '26px', lg: '32px', xl: '44px' },
        }}
        value={chainId}
        onChange={handleChangeChain}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        <Tab
          value={ChainId.ALL}
          label="All Networks"
          icon={<HumanIcon />}
          iconPosition={isMobile ? 'top' : 'start'}
        />
        {SUPPORTED_CHAIN_IDS.map((chainId) => (
          <Tab
            key={chainId}
            value={chainId}
            label={ESCROW_NETWORKS[chainId]?.title}
            icon={NETWORK_ICONS[chainId] ?? ''}
            iconPosition={isMobile ? 'top' : 'start'}
          />
        ))}
      </Tabs>
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
