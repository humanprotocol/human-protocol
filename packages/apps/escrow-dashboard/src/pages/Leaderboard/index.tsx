import * as React from 'react';
import { Leaderboard, PageWrapper } from 'src/components';

export const LeaderboardPage: React.FC = (): React.ReactElement => {
  return (
    <PageWrapper>
      <Leaderboard />
    </PageWrapper>
  );
};
