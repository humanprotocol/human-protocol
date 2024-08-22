import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import SimpleBar from 'simplebar-react';
import { Table } from '@components/Home/Leaderboard/components/Table/Table';
import { SelectNetwork } from '@components/Home/Leaderboard/components/SelectNetwork';
import { useLeaderboardDetails } from '@services/api/use-leaderboard-details';
import Box from '@mui/material/Box';
import { useNavigate } from 'react-router-dom';
import { colorPalette } from '@assets/styles/color-palette';

const Leaderboard = () => {
	const { data, status, error } = useLeaderboardDetails();
	const navigate = useNavigate();

	const isMoreThatFiveEntries = data?.length && data.length > 5;

	return (
		<>
			<TableContainer
				component={Paper}
				sx={{
					padding: '32px',
					marginTop: '30px',
					display: 'flex',
					flexDirection: 'column',
					gap: '12px',
				}}
			>
				<div className="mobile-select">
					<SelectNetwork />
				</div>
				<SimpleBar>
					<Table
						data={isMoreThatFiveEntries ? data.slice(0, 5) : data}
						status={status}
						error={error}
					/>
				</SimpleBar>
				{isMoreThatFiveEntries ? (
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
		</>
	);
};

export default Leaderboard;
