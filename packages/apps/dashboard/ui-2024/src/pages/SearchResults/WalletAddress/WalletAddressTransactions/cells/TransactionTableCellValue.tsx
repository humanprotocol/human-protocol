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

	const formattedValue = Number(ethers.formatEther(value));
	const displayValue = Number.isInteger(formattedValue)
		? formattedValue
		: formattedValue.toFixed(4);

	return (
		<Typography>
			{displayValue}
			<Typography component="span">HMT</Typography>
		</Typography>
	);
};
