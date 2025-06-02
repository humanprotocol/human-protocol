import Breadcrumbs from '@/components/Breadcrumbs';
import { LeaderboardIcon } from '@/components/Icons/LeaderboardIcon';
import PageWrapper from '@/components/PageWrapper';
import ShadowIcon from '@/components/ShadowIcon';
import { useLeaderboardDetails } from '@/services/api/use-leaderboard-details';

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
