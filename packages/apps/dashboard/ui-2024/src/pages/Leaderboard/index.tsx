import Breadcrumbs from '@components/Breadcrumbs';
import PageWrapper from '@components/PageWrapper';
import ShadowIcon from '@components/ShadowIcon';
import cup from '@assets/cup.png';
import { Leaderboard } from '../../features/Leaderboard/index';
import { useLeaderboardAllDetails } from '@services/api/use-leaderboard-all-details';

export const LeaderBoard = () => {
	const { data, status, error } = useLeaderboardAllDetails();
	const isMoreThatFiveEntries = data?.length && data.length > 5;

	return (
		<PageWrapper displaySearchBar className="standard-background">
			<Breadcrumbs title="Leaderboard" />
			<ShadowIcon
				className="home-page-leaderboard"
				title="Leaderboard"
				img={cup}
			/>
			<Leaderboard
				data={isMoreThatFiveEntries ? data.slice(0, 5) : data}
				status={status}
				error={error}
			/>
		</PageWrapper>
	);
};
