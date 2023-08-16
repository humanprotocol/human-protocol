import { Box, CircularProgress, Grid, Typography } from '@mui/material';
import { FC } from 'react';

import { CardTextBlock } from '../Cards';

import {
  useTokenStatsByChainId,
  useTokenStatsLoaded,
} from 'src/state/token/hooks';

export const TokenView: FC = () => {
  const { totalTransferEventCount, holders, totalSupply } =
    useTokenStatsByChainId();
  const loaded = useTokenStatsLoaded();

  const totalSupplyComponent = (value: number) => {
    const formatter = new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'long',
    });
    const compactNumber = formatter.format(value);
    const [number, unit] = compactNumber.split(' ');

    return (
      <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 3 }}>
        <Typography
          variant="h2"
          color="primary"
          lineHeight={1}
          sx={{ fontSize: { xs: 32, md: 48, lg: 64, xl: 80 } }}
        >
          {number}
        </Typography>
        <Typography
          variant="h4"
          color="primary"
          sx={{
            fontSize: { xs: 14, md: 22, lg: 28, xl: 34 },
            textTransform: 'capitalize',
            ml: 2,
          }}
          lineHeight={1}
        >
          {unit}
        </Typography>
      </Box>
    );
  };

  return (
    <Box>
      {loaded ? (
        <Grid container spacing={{ xs: 2, sm: 2, md: 3, lg: 4, xl: 5 }}>
          <Grid item xs={12} md={4}>
            <CardTextBlock
              title="Amount of transfers"
              value={totalTransferEventCount}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <CardTextBlock title="Holders" value={holders} />
          </Grid>
          <Grid item xs={12} md={4}>
            <CardTextBlock
              title="Total Supply"
              component={totalSupplyComponent(Number(totalSupply))}
            />
          </Grid>
        </Grid>
      ) : (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress size={36} />
        </Box>
      )}
    </Box>
  );
};
