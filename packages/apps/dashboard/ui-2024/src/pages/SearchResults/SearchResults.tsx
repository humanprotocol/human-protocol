import PageWrapper from '@components/PageWrapper';
import Stack from '@mui/material/Stack';
import ShadowIcon from '@components/ShadowIcon';
import WalletIcon from '@assets/icons/shadowed/wallet.svg';
import EscrowIcon from '@assets//icons/shadowed/escrow.svg';
import Clipboard from '@components/Clipboard';
import { useState } from 'react';
import RoleDetails from '@pages/SearchResults/RoleDetails';
import { useParams } from 'react-router-dom';
import EscrowAddress from '@pages/SearchResults/EscrowAddress';
import WalletAddress from '@pages/SearchResults/WalletAddress';

// const TOKEN_ID = '0x67499f129433b82e5a4e412143a395e032e76c0dc0f83606031';

const renderCurrentResultType = (type: 1 | 2 | 3) => {
	const renderType = {
		1: {
			title: 'Role Details',
			icon: WalletIcon,
		},
		2: {
			title: 'Escrow Address',
			icon: EscrowIcon,
		},
		3: {
			title: 'Wallet Address',
			icon: WalletIcon,
		},
	};

	return (
		<ShadowIcon img={renderType[type].icon} title={renderType[type].title} />
	);
};

const SearchResults = () => {
	const { tokenId } = useParams();
	const [currentState] = useState<number>(3);
	return (
		<PageWrapper displaySearchBar>
			<Stack
				sx={{ marginBottom: 2 }}
				direction={{ xs: 'column', md: 'row' }}
				gap={3}
				alignItems={{ xs: 'stretch', md: 'center' }}
			>
				{renderCurrentResultType(1)}
				<Clipboard value={tokenId ?? ''} />
			</Stack>

			{currentState === 1 && <RoleDetails />}
			{currentState === 2 && <EscrowAddress />}
			{currentState === 3 && <WalletAddress />}
			{currentState === 4 && <div>Not Found</div>}
		</PageWrapper>
	);
};

export default SearchResults;
