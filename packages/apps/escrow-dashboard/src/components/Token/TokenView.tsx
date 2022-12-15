import { Grid } from '@mui/material';
import * as React from 'react';
import { CardTextBlock } from 'src/components/Cards';
import { useTokenStatsByChainId } from 'src/state/token/hooks';

export const TokenView: React.FC = (): React.ReactElement => {
  const { totalTransferEventCount, holders, totalSupply } =
    useTokenStatsByChainId();

  return (
    <Grid container spacing={{ xs: 2, sm: 2, md: 3, lg: 4, xl: 5 }}>
      <Grid item xs={12} sm={6} md={4}>
        <CardTextBlock
          title="Amount of transfers"
          value={totalTransferEventCount}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <CardTextBlock title="Holders" value={holders} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <CardTextBlock
          title="Total Supply"
          value={Number(totalSupply)}
          format={
            Number(totalSupply) >= Number('1e+18')
              ? '0,0e+0'
              : Number(totalSupply) >= Number('1e+9')
              ? '0a'
              : '0,0'
          }
        />
      </Grid>
    </Grid>
  );
};
