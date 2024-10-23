import AbbreviateClipboard from '@components/SearchResults/AbbreviateClipboard';
import { Box } from '@mui/material';

export const AddressCell = ({
	chainId,
	address,
}: {
	chainId: string;
	address: string;
}) => (
	<Box display="flex" alignItems="center" gap="18px" height="100%">
		<AbbreviateClipboard
			value={address}
			link={`/search/${chainId}/${address}`}
		/>
	</Box>
);
