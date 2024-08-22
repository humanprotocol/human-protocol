import EthereumIcon from '@components/Icons/EthereumIcon';
import BinanceSmartChainIcon from '@components/Icons/BinanceSmartChainIcon';
import PolygonIcon from '@components/Icons/PolygonIcon';
import MoonbeamIcon from '@components/Icons/MoonbeamIcon';
import MoonbaseAlphaIcon from '@components/Icons/MoonbaseAlphaIcon';
import CeloIcon from '@assets/icons/celo.svg';
import SvgIcon from '@mui/material/SvgIcon';
import HumanIcon from '@components/Icons/HumanIcon';

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
			case 43113: // Avalanche Fuji Testnet
			case 43114: // Avalanche C-Chain
			case 195: // X Layer Testnet
			case 196: // X Layer Mainnet
			case 1338: // Elysium Testnet
				return <HumanIcon />;
			default:
				return <HumanIcon />;
		}
	})();

	return <SvgIcon>{icon}</SvgIcon>;
};
