import EthereumIcon from './Icons/EthereumIcon';
import BinanceSmartChainIcon from './Icons/BinanceSmartChainIcon';
import PolygonIcon from './Icons/PolygonIcon';
import MoonbeamIcon from './Icons/MoonbeamIcon';
import MoonbaseAlphaIcon from './Icons/MoonbaseAlphaIcon';
import { XLayerIcon } from './Icons/XLayerIcon';
import { AvalancheIcon } from './Icons/AvalancheIcon';
import AuroraIcon from './Icons/AuroraIcon';

export const NetworkIcon = ({ chainId }: { chainId?: number }) => {
  const icon = (() => {
    switch (chainId) {
      case 1:
      case 4:
      case 5:
      case 11155111:
        return <EthereumIcon />;
      case 56:
      case 97:
        return <BinanceSmartChainIcon />;
      case 137:
      case 80001:
      case 80002:
        return <PolygonIcon />;
      case 1284:
        return <MoonbeamIcon />;
      case 1287:
        return <MoonbaseAlphaIcon />;
      case 195:
      case 196:
        return <XLayerIcon />;
      case 43113:
      case 43114:
        return <AvalancheIcon />;
      case 1313161555:
        return <AuroraIcon />;
      default:
        return <PolygonIcon />;
    }
  })();

  return <>{icon}</>;
};
