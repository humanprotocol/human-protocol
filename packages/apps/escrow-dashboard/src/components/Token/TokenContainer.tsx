import { Box } from '@mui/material';
import { FC } from 'react';

import { ViewTitle } from '../ViewTitle';
import { TokenView } from './TokenView';

import tokenSvg from 'src/assets/token.svg';
import { usePollTokenStats } from 'src/state/token/hooks';

export const TokenContainer: FC = () => {
  usePollTokenStats();

  return (
    <Box mt={{ xs: 4, md: 8 }} id="token">
      <ViewTitle title="Token" iconUrl={tokenSvg} />
      <Box mt={{ xs: 4, md: 8 }}>
        <TokenView />
      </Box>
    </Box>
  );
};
