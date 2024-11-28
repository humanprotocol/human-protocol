import { colorPalette } from '@assets/styles/color-palette';
import Paper from '@mui/material/Paper';
import TableContainer from '@mui/material/TableContainer';
import { LeaderBoardData } from '@services/api/use-leaderboard-details';
import { useNavigate } from 'react-router-dom';
import SimpleBar from 'simplebar-react';
import { SelectNetwork } from './components/SelectNetwork';
import { DataGridWrapper } from './components/DataGridWrapper';
import { Button, Typography } from '@mui/material';

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
			sx={{
				padding: '32px',
				marginTop: '30px',
				borderRadius: '16px',
				boxShadow: 'none',
			}}
		>
			<div className="mobile-select">
				<SelectNetwork />
			</div>
			<SimpleBar>
				<DataGridWrapper data={data} status={status} error={error} />
			</SimpleBar>
			{viewAllBanner ? (
				<Button
					sx={{
						height: '42px',
						border: `1px ${colorPalette.primary.main} solid`,
						borderRadius: '4px',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						cursor: 'pointer',
					}}
					fullWidth
					onClick={() => {
						navigate('/leaderboard');
					}}
				>
					<Typography variant="Components/Button Large">View All</Typography>
				</Button>
			) : null}
		</TableContainer>
	);
};
