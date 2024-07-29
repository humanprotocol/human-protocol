import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { colorPalette } from '@assets/styles/color-palette';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export const TransactionsTableHead = () => {
	return (
		<TableHead
			sx={{
				borderBottom: `1px solid ${colorPalette.fog.main}`,
			}}
		>
			<TableRow>
				<TableCell
					sx={{
						p: 0,
					}}
				>
					<Stack direction="row" alignItems="center">
						<Tooltip title="Transaction identifier">
							<IconButton sx={{ padding: 0, paddingRight: 1 }}>
								<HelpOutlineIcon fontSize="small" />
							</IconButton>
						</Tooltip>
						<Typography fontWeight={600}>Transaction Hash</Typography>
					</Stack>
				</TableCell>
				<TableCell>
					<Stack direction="row" alignItems="center">
						<Tooltip title="Function executed in the transaction">
							<IconButton sx={{ padding: 0, paddingRight: 1 }}>
								<HelpOutlineIcon fontSize="small" />
							</IconButton>
						</Tooltip>
						<Typography fontWeight={600}>Method</Typography>
					</Stack>
				</TableCell>
				<TableCell>
					<Stack direction="row" alignItems="center">
						<Tooltip title="Identifier of the block that contains the transaction">
							<IconButton sx={{ padding: 0, paddingRight: 1 }}>
								<HelpOutlineIcon fontSize="small" />
							</IconButton>
						</Tooltip>
						<Typography fontWeight={600}>Block</Typography>
					</Stack>
				</TableCell>
				<TableCell>
					<Stack direction="row" alignItems="center">
						<Tooltip title="Amount of HMT transferred in the transaction">
							<IconButton sx={{ padding: 0, paddingRight: 1 }}>
								<HelpOutlineIcon fontSize="small" />
							</IconButton>
						</Tooltip>
						<Typography fontWeight={600}>Value</Typography>
					</Stack>
				</TableCell>
				<TableCell>
					<Typography fontWeight={600}>Escrow Address</Typography>
				</TableCell>
			</TableRow>
		</TableHead>
	);
};
