import EthereumIcon from '@components/Icons/EthereumIcon';
import BinanceSmartChainIcon from '@components/Icons/BinanceSmartChainIcon';
import PolygonIcon from '@components/Icons/PolygonIcon';
import MoonbeamIcon from '@components/Icons/MoonbeamIcon';
import MoonbaseAlphaIcon from '@components/Icons/MoonbaseAlphaIcon';
import CeloIcon from '@assets/icons/celo.svg';
import { XLayerIcon } from '@components/Icons/XLayerIcon';
import HumanIcon from '@components/Icons/HumanIcon';
import { AvalancheIcon } from '@components/Icons/AvalancheIcon';

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
			case 42220:
			case 44787:
				return <CeloIcon />;
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
