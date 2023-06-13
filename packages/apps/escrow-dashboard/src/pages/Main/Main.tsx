import { Grid } from '@mui/material';
import { FC } from 'react';

import {
  EscrowContainer,
  LeaderboardContainer,
  TokenContainer,
  SolvedTasksContainer,
  PageWrapper,
} from 'src/components';

export const Main: FC = () => {
  return (
    <PageWrapper>
      <Grid container spacing={4}>
        <Grid item xs={12} lg={6}>
          <SolvedTasksContainer />
        </Grid>
        {/* <Grid item xs={12} lg={6}>
            <News />
          </Grid> */}
      </Grid>
      <EscrowContainer />
      <TokenContainer />
      <LeaderboardContainer showAll={false} />
    </PageWrapper>
  );
};
