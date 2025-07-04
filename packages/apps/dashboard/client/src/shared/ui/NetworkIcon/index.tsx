import type { ChainId } from '@human-protocol/sdk/src/enums';

import BinanceSmartChainIcon from '@/shared/ui/icons/BinanceSmartChainIcon';
import EthereumIcon from '@/shared/ui/icons/EthereumIcon';
import HumanIcon from '@/shared/ui/icons/HumanIcon';
import PolygonIcon from '@/shared/ui/icons/PolygonIcon';

export const NetworkIcon = ({ chainId }: { chainId: ChainId }) => {
  const icon = (() => {
    switch (chainId) {
      case 1:
      case 11155111:
        return <EthereumIcon />;
      case 56:
      case 97:
        return <BinanceSmartChainIcon />;
      case 137:
      case 80002:
        return <PolygonIcon />;
      default:
        return <HumanIcon />;
    }
  })();

  return <>{icon}</>;
};
