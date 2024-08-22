import Breadcrumbs from '@components/Breadcrumbs';
import PageWrapper from '@components/PageWrapper';
import ShadowIcon from '@components/ShadowIcon';
import cup from '@assets/cup.png';
import { useLeaderboardDetails } from '@services/api/use-leaderboard-details';
import TableContainer from '@mui/material/TableContainer';
import { SelectNetwork } from '@components/Home/Leaderboard/components/SelectNetwork';
import SimpleBar from 'simplebar-react';
import { Table } from '@components/Home/Leaderboard/components/Table/Table';
import Paper from '@mui/material/Paper';

export const LeaderBoard = () => {
	const { data, status, error } = useLeaderboardDetails();
	return (
		<PageWrapper displaySearchBar className="standard-background">
			<Breadcrumbs title="Leaderboard" />
			<ShadowIcon
				className="home-page-leaderboard"
				title="Leaderboard"
				img={cup}
			/>
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
			</TableContainer>
		</PageWrapper>
	);
};
