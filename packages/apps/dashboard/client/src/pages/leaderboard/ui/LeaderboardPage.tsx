import Leaderboard from '@/features/leaderboard';
import Breadcrumbs from '@/shared/ui/Breadcrumbs';
import LeaderboardIcon from '@/shared/ui/icons/LeaderboardIcon';
import ShadowIcon from '@/shared/ui/ShadowIcon';
import PageWrapper from '@/widgets/page-wrapper';

const LeaderboardPage = () => {
  return (
    <PageWrapper className="standard-background">
      <Breadcrumbs title="Leaderboard" />
      <ShadowIcon
        className="home-page-leaderboard"
        title="Leaderboard"
        img={<LeaderboardIcon />}
      />
      <Leaderboard />
    </PageWrapper>
  );
};

export default LeaderboardPage;
