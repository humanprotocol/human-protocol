import { formatHMTDecimals } from '@helpers/formatHMTDecimals';
import Typography from '@mui/material/Typography';
import { useHMTPrice } from '@services/api/use-hmt-price';

export const TransactionTableCellValue = ({ value }: { value: string }) => {
	const { isError, isPending } = useHMTPrice();

	if (isError) {
		return <span>N/A</span>;
	}

	if (isPending) {
		return <span>...</span>;
	}

	return (
		<Typography>
			{formatHMTDecimals(value)}
			<Typography component="span">HMT</Typography>
		</Typography>
	);
};
