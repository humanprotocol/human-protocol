import { colorPalette } from '@assets/styles/color-palette';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TableContainer from '@mui/material/TableContainer';
import { LeaderBoardData } from '@services/api/use-leaderboard-details';
import { useNavigate } from 'react-router-dom';
import SimpleBar from 'simplebar-react';
import { SelectNetwork } from './components/SelectNetwork';
import { Table } from './components/Table';

export type LeaderboardCommonProps = {
	data: LeaderBoardData | undefined;
	status: 'success' | 'error' | 'pending';
	error: unknown;
};

export const Leaderboard = ({
	data,
	status,
	error,
	viewAllBanner,
}: LeaderboardCommonProps & {
	viewAllBanner?: boolean;
}) => {
	const navigate = useNavigate();
	return (
		<TableContainer
			component={Paper}
			sx={{ padding: '32px', marginTop: '30px' }}
		>
			<div className="mobile-select">
				<SelectNetwork />
			</div>
			<SimpleBar>
				<Table data={data} status={status} error={error} />
			</SimpleBar>
			{viewAllBanner ? (
				<Box
					sx={{
						height: '42px',
						border: `1px ${colorPalette.primary.main} solid`,
						borderRadius: '4px',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						cursor: 'pointer',
					}}
					onClick={() => {
						navigate('/leaderboard');
					}}
				>
					View All
				</Box>
			) : null}
		</TableContainer>
	);
};
