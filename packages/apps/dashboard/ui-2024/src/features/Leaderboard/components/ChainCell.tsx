import { Typography } from '@mui/material';
import { NetworkIcon } from '@components/NetworkIcon';
import { getNetwork } from '@utils/config/networks';

export const ChainCell = ({ chainId }: { chainId: number }) => (
	<Typography
		variant="body1"
		whiteSpace="nowrap"
		flexWrap="nowrap"
		alignItems="center"
		display="flex"
		justifyContent="flex-start"
		gap="6px"
		height="100%"
	>
		<NetworkIcon chainId={chainId} />
		{getNetwork(chainId)?.name}
	</Typography>
);
