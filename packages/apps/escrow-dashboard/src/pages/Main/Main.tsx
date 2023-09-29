import { FC } from 'react';

import {
  HumanAppDataContainer,
  // LeaderboardContainer,
  TokenContainer,
  SolvedTasksContainer,
  PageWrapper,
} from 'src/components';

export const Main: FC = () => {
  return (
    <PageWrapper>
      <SolvedTasksContainer />
      <HumanAppDataContainer />
      <TokenContainer />
      {/* <LeaderboardContainer showAll={false} /> */}
    </PageWrapper>
  );
};
