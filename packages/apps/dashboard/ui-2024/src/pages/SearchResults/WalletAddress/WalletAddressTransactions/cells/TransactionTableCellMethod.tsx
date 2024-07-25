import { colorPalette } from '@assets/styles/color-palette';
import Box from '@mui/material/Box/Box';
import Typography from '@mui/material/Typography';
import { capitalize } from '@mui/material';

export const TransactionTableCellMethod = ({ method }: { method: string }) => {
	const methodAttributes: Record<
		string,
		{ color: { text: string; border: string } }
	> = {
		transfer: {
			color: {
				text: colorPalette.success.main,
				border: colorPalette.success.light,
			},
		},
		complete: {
			color: {
				text: colorPalette.success.main,
				border: colorPalette.success.light,
			},
		},
		payout: {
			color: {
				text: colorPalette.secondary.main,
				border: colorPalette.secondary.light,
			},
		},
	};

	const currentStatusColors =
		methodAttributes[method]?.color || colorPalette.success.main;

	return (
		<Box
			sx={{
				display: 'inline-flex',
				paddingX: 2,
				paddingY: 1,
				borderRadius: 4,
				border: `1px solid ${currentStatusColors.border}`,
			}}
		>
			<Typography>{capitalize(method)}</Typography>
		</Box>
	);
};
