import { useLeaderboardDetails } from '@services/api/use-leaderboard-details';
import { Leaderboard as LeaderboardFeature } from '../../features/Leaderboard';

export const Leaderboard = () => {
  const { data, status, error } = useLeaderboardDetails(4);

  return (
    <LeaderboardFeature
      data={data}
      status={status}
      error={error}
      viewAllBanner
    />
  );
};
