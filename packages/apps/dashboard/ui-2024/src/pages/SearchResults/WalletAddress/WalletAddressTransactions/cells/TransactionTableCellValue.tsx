import Typography from '@mui/material/Typography';
import { useHMTPrice } from '@services/api/use-hmt-price';
import { ethers } from 'ethers';

export const TransactionTableCellValue = ({ value }: { value: string }) => {
	const { isError, isPending } = useHMTPrice();

	if (isError) {
		return 'N/A';
	}

	if (isPending) {
		return '...';
	}

	return (
		<Typography>
			{Number(ethers.formatEther(value)).toFixed()}
			<Typography component="span">HMT</Typography>
		</Typography>
	);
};
