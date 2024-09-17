import { useLeaderboardDetails } from '@services/api/use-leaderboard-details';
import { Leaderboard as LeaderboardFeature } from '../../features/Leaderboard';

export const Leaderboard = () => {
	const { data, status, error } = useLeaderboardDetails();
	const isMoreThatFiveEntries = data?.length && data.length > 5;

	return (
		<LeaderboardFeature
			data={isMoreThatFiveEntries ? data.slice(0, 5) : data}
			status={status}
			error={error}
			viewAllBanner
		/>
	);
};
