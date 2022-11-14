import { Grid } from '@mui/material';
import * as React from 'react';
import { CardTextBlock } from 'src/components/Cards';
import useHMTData from 'src/hooks/useHMTData';
import useTokenStatistics from 'src/hooks/useTokenStatistics';

export const TokenView: React.FC = (): React.ReactElement => {
  const tokenStatistics = useTokenStatistics();
  const data = useHMTData();

  const totalEvents = React.useMemo(() => {
    const { totalTransferEventCount, totalApprovalEventCount } =
      tokenStatistics || {};
    if (totalApprovalEventCount && totalTransferEventCount) {
      return Number(totalApprovalEventCount) + Number(totalTransferEventCount);
    }

    return 'N/A';
  }, [tokenStatistics]);

  return (
    <Grid container spacing={{ xs: 2, sm: 2, md: 3, lg: 4, xl: 5 }}>
      <Grid item xs={12} sm={4}>
        <CardTextBlock
          title="Price"
          value={data?.currentPriceInUSD}
          format="$0,0.00"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <CardTextBlock title="Amount of transfers" value={totalEvents} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <CardTextBlock title="Holders" value={tokenStatistics?.holders} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <CardTextBlock
          title="Circulating Supply"
          value={data?.circulatingSupply}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <CardTextBlock title="Total Supply" value={data?.totalSupply} />
      </Grid>
    </Grid>
  );
};
