import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const Loader = ({ height = '100vh' }: { height?: string }) => {
	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height,
			}}
		>
			<CircularProgress />
		</Box>
	);
};

export default Loader;
