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
import NothingFound from '@components/NothingFound';

// const TOKEN_ID = '0x67499f129433b82e5a4e412143a395e032e76c0dc0f83606031';

const renderCurrentResultType = (
	type: 'roleDetails' | 'escrowAddress' | 'walletAddress' | null,
	tokenId: string | undefined
) => {
	const renderType = {
		roleDetails: {
			title: 'Role Details',
			icon: WalletIcon,
		},
		escrowAddress: {
			title: 'Escrow Address',
			icon: EscrowIcon,
		},
		walletAddress: {
			title: 'Wallet Address',
			icon: WalletIcon,
		},
	};

	if (type == null) {
		return null;
	}

	return (
		<>
			<ShadowIcon img={renderType[type].icon} title={renderType[type].title} />
			<Clipboard value={tokenId ?? ''} />
		</>
	);
};

const SearchResults = () => {
	const { tokenId } = useParams();
	const [currentState] = useState<
		'roleDetails' | 'escrowAddress' | 'walletAddress' | null
	>(null);
	return (
		<PageWrapper displaySearchBar>
			<Stack
				sx={{ marginBottom: 2 }}
				direction={{ xs: 'column', md: 'row' }}
				gap={3}
				alignItems={{ xs: 'stretch', md: 'center' }}
			>
				{renderCurrentResultType(currentState, tokenId)}
			</Stack>

			{currentState === 'roleDetails' && <RoleDetails />}
			{currentState === 'escrowAddress' && <EscrowAddress />}
			{currentState === 'walletAddress' && <WalletAddress />}
			{currentState === null && <NothingFound />}
		</PageWrapper>
	);
};

export default SearchResults;
