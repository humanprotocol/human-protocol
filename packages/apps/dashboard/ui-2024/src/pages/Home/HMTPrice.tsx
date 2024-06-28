import { useHMTPrice } from '../../services/api/use-hmt-price';
import Typography from '@mui/material/Typography';

export function HMTPrice() {
	const { data, status } = useHMTPrice();
	return (
		<div>
			<Typography variant="h6" component="p">
				HMT Price
			</Typography>
			<div className="count">
				{status === 'success' && data['human-protocol'].usd}
				{status === 'pending' && '...'}
				{status === 'error' && 'No data'}
			</div>
		</div>
	);
}
