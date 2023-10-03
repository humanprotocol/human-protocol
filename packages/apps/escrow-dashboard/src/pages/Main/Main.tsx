import { FC } from 'react';

import {
  EscrowContainer,
  // LeaderboardContainer,
  TokenContainer,
  SolvedTasksContainer,
  PageWrapper,
} from 'src/components';

export const Main: FC = () => {
  return (
    <PageWrapper>
      <SolvedTasksContainer />
      <EscrowContainer />
      <TokenContainer />
      {/* <LeaderboardContainer showAll={false} /> */}
    </PageWrapper>
  );
};
