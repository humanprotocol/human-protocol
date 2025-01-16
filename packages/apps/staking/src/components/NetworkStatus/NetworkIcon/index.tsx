import EthereumIcon from './Icons/EthereumIcon';
import BinanceSmartChainIcon from './Icons/BinanceSmartChainIcon';
import PolygonIcon from './Icons/PolygonIcon';
import MoonbeamIcon from './Icons/MoonbeamIcon';
import MoonbaseAlphaIcon from './Icons/MoonbaseAlphaIcon';
import { XLayerIcon } from './Icons/XLayerIcon';
import HumanIcon from './Icons/HumanIcon';
import { AvalancheIcon } from './Icons/AvalancheIcon';

export const NetworkIcon = ({ chainId }: { chainId: number }) => {
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
      default:
        return <HumanIcon />;
    }
  })();

  return <>{icon}</>;
};
