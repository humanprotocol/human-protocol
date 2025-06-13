import { useLeaderboardDetails } from '@/services/api/use-leaderboard-details';
import Breadcrumbs from '@/shared/ui/Breadcrumbs';
import LeaderboardIcon from '@/shared/ui/icons/LeaderboardIcon';
import ShadowIcon from '@/shared/ui/ShadowIcon';
import PageWrapper from '@/widgets/page-wrapper';

import { Leaderboard } from '../../features/Leaderboard/index';

const LeaderBoard = () => {
  const { data, status, error } = useLeaderboardDetails();

  return (
    <PageWrapper className="standard-background">
      <Breadcrumbs title="Leaderboard" />
      <ShadowIcon
        className="home-page-leaderboard"
        title="Leaderboard"
        img={<LeaderboardIcon />}
      />
      <Leaderboard data={data} status={status} error={error} />
    </PageWrapper>
  );
};

export default LeaderBoard;
