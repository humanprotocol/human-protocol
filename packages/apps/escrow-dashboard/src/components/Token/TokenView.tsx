import { Grid, Typography } from '@mui/material';
import * as React from 'react';
import { CardTextBlock } from 'src/components/Cards';
import BitfinexIcon from 'src/components/Icons/BitfinexIcon';
import useBitfinexTicker from 'src/hooks/useBitfinexTicker';
import { useTokenStatsByChainId } from 'src/state/token/hooks';

export const TokenView: React.FC = (): React.ReactElement => {
  const { totalTransferEventCount, holders, totalSupply } =
    useTokenStatsByChainId();
  const bitfinexTicker = useBitfinexTicker();

  return (
    <Grid container spacing={{ xs: 2, sm: 2, md: 3, lg: 4, xl: 5 }}>
      <Grid item xs={12} sm={6}>
        <CardTextBlock
          title="Amount of transfers"
          value={totalTransferEventCount}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <CardTextBlock title="Holders" value={holders} />
      </Grid>
      <Grid item xs={12} sm={6}>
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
      <Grid item xs={12} sm={6}>
        <CardTextBlock
          title={
            <Typography
              component="span"
              sx={{ display: 'flex', alignItems: 'center' }}
              fontWeight={600}
              variant="body2"
            >
              <BitfinexIcon sx={{ fontSize: '1rem', mr: 1 }} />
              Bitfinex 24h Liquidity Volume
            </Typography>
          }
          value={bitfinexTicker?.volume}
          format={'$0,0.00'}
        />
      </Grid>
    </Grid>
  );
};
