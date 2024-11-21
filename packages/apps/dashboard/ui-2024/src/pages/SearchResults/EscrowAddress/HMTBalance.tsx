import { colorPalette } from '@assets/styles/color-palette';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useHMTPrice } from '@services/api/use-hmt-price';

export const HMTBalance = ({ HMTBalance }: { HMTBalance: number }) => {
	const { data, isError, isPending } = useHMTPrice();

	if (isError) {
		return <span>N/A</span>;
	}

	if (isPending) {
		return <span>...</span>;
	}
	const HMTBalanceInDollars = HMTBalance * data.hmtPrice;

	return (
		<Stack sx={{ whiteSpace: 'nowrap', flexDirection: 'row' }}>
			<Typography variant="body2">{HMTBalance}</Typography>
			<Typography
				sx={{
					marginLeft: 0.5,
				}}
				color={colorPalette.fog.main}
				component="span"
				variant="body2"
			>
				{`HMT($${HMTBalanceInDollars.toFixed(2)})`}
			</Typography>
		</Stack>
	);
};
