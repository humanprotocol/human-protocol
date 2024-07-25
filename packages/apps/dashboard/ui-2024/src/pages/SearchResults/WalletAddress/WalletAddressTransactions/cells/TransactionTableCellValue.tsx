import Typography from '@mui/material/Typography';
import { colorPalette } from '@assets/styles/color-palette';
import { useHMTPrice } from '@services/api/use-hmt-price';
import { ethers } from 'ethers';

export const TransactionTableCellValue = ({ value }: { value: string }) => {
	const { data, isError, isPending } = useHMTPrice();

	if (isError) {
		return 'N/A';
	}

	if (isPending) {
		return '...';
	}
	const valueInDollars = ethers.formatEther(`${data.hmtPrice * Number(value)}`);

	return (
		<Typography>
			{ethers.formatEther(value)}
			<Typography component="span">HMT</Typography>
			<Typography
				sx={{
					marginRight: 0,
				}}
				color={colorPalette.fog.main}
				component="span"
			>
				{`($${valueInDollars})`}
			</Typography>
		</Typography>
	);
};
