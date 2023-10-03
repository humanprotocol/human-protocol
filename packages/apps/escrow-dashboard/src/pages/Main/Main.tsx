import { FC } from 'react';

import {
  HumanAppDataContainer,
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
    </PageWrapper>
  );
};
