import * as React from 'react';

import { Escrow, Token, Leaderboard, PageWrapper } from 'src/components';

export const Main: React.FC = (): React.ReactElement => {
  return (
    <PageWrapper>
      <Escrow />
      <Token />
      <Leaderboard showAll={false} />
    </PageWrapper>
  );
};
