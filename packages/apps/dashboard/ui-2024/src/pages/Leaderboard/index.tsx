import Breadcrumbs from '@components/Breadcrumbs';
import PageWrapper from '@components/PageWrapper';
import ShadowIcon from '@components/ShadowIcon';
import { Leaderboard } from '../../features/Leaderboard/index';
import { useLeaderboardDetails } from '@services/api/use-leaderboard-details';
import { LeaderboardIcon } from '@components/Icons/LeaderboardIcon';

export const LeaderBoard = () => {
  const { data, status, error } = useLeaderboardDetails();
  const isMoreThatFiveEntries = data?.length && data.length > 5;

  return (
    <PageWrapper className="standard-background">
      <Breadcrumbs title="Leaderboard" />
      <ShadowIcon
        className="home-page-leaderboard"
        title="Leaderboard"
        img={<LeaderboardIcon />}
      />
      <Leaderboard
        data={isMoreThatFiveEntries ? data.slice(0, 5) : data}
        status={status}
        error={error}
      />
    </PageWrapper>
  );
};
