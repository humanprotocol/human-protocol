import { Typography } from '@mui/material';

interface TextCellProps {
	value: string;
}

export const TextCell = ({ value }: TextCellProps) => (
	<Typography
		height="100%"
		variant="body1"
		alignItems="center"
		display="flex"
		justifyContent="flex-start"
		fontWeight={500}
	>
		{value}
	</Typography>
);
