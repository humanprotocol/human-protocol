import { useLeaderboardDetails } from '@services/api/use-leaderboard-details';
import { Leaderboard as LeaderboardFeature } from '../../features/Leaderboard';

export const Leaderboard = () => {
  const { data, status, error } = useLeaderboardDetails();
  const isMoreThatFourEntries = data?.length && data.length > 4;

  return (
    <LeaderboardFeature
      data={isMoreThatFourEntries ? data.slice(0, 4) : data}
      status={status}
      error={error}
      viewAllBanner
    />
  );
};
