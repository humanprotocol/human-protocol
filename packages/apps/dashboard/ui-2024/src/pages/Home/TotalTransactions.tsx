import { FormatNumber } from '@components/Home/FormatNumber';
import Typography from '@mui/material/Typography';
import { useGeneralStats } from '@services/api/use-general-stats';

export function TotalTransactions() {
	const { data, status } = useGeneralStats();

	return (
		<div>
			<Typography variant="h6" component="p">
				Total Transactions
			</Typography>
			<div className="count">
				{status === 'success' && (
					<FormatNumber value={data.totalTransactions} />
				)}
				{status === 'pending' && '...'}
				{status === 'error' && 'No data'}
			</div>
		</div>
	);
}
