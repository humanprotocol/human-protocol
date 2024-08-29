import { FC } from 'react';
import Typography from '@mui/material/Typography';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { useNavigate } from 'react-router-dom';

const Breadcrumbs: FC<{ title?: string }> = ({ title }) => {
	const navigate = useNavigate();
	return (
		<div className="breadcrumbs">
			<Typography
				onClick={() => {
					navigate('/');
				}}
				component="span"
				fontSize={16}
				sx={{ textDecoration: 'unset', cursor: 'pointer' }}
				color="text.secondary"
			>
				Dashboard
			</Typography>
			<KeyboardArrowRightIcon color="primary" />
			<Typography component="span" fontSize={16} color="primary">
				{title}
			</Typography>
		</div>
	);
};

export default Breadcrumbs;
