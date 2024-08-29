import { useHcaptchaGeneralStats } from '@services/api/use-hcaptcha-general-stats';
import Typography from '@mui/material/Typography';
import { FormatNumber } from '@components/Home/FormatNumber';

export function TotalNumberOfTasks() {
	const { data, status } = useHcaptchaGeneralStats();

	return (
		<div>
			<Typography variant="h6" component="p">
				Total Number of Tasks
			</Typography>
			<div className="count">
				{status === 'success' && <FormatNumber value={data.solved} />}
				{status === 'pending' && '...'}
				{status === 'error' && 'No data'}
			</div>
		</div>
	);
}
