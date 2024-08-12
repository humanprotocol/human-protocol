import { FormatNumber } from '@components/Home/FormatNumber';
import Typography from '@mui/material/Typography';
import { useGeneralStats } from '@services/api/use-general-stats';

export function Holders() {
	const { data, status } = useGeneralStats();

	return (
		<div>
			<Typography variant="h6" component="p">
				Holders
			</Typography>
			<div className="count">
				{status === 'success' && <FormatNumber value={data.totalHolders} />}
				{status === 'pending' && '...'}
				{status === 'error' && 'No data'}
			</div>
		</div>
	);
}
