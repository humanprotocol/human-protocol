import { ChainId } from '@human-protocol/sdk';
import { Box, Link, Grid, Typography } from '@mui/material';
import { FC, useMemo } from 'react';

import { CardTextBlock } from '../Cards';
// import bingXIcon from 'src/assets/exchanges/bingx.png';
import bitfinexIcon from 'src/assets/exchanges/bitfinex.png';
import bitmartIcon from 'src/assets/exchanges/bitmart.png';
import coinlistProIcon from 'src/assets/exchanges/coinlist-pro.png';
import gateIoIcon from 'src/assets/exchanges/gate-io.png';
import lBankIcon from 'src/assets/exchanges/lbank.svg';
import mexcIcon from 'src/assets/exchanges/mexc.png';
import probitGlobalIcon from 'src/assets/exchanges/probit-global.png';
import { TOOLTIPS } from 'src/constants/tooltips';
import { useHumanAppData } from 'src/hooks/useHumanAppData';
import { useChainId, useDays } from 'src/state/humanAppData/hooks';

const EXCHANGES = [
  {
    icon: bitfinexIcon,
    href: 'https://trading.bitfinex.com/t/HMT:USD?type=exchange',
    name: 'Bitfinex',
  },
  {
    icon: probitGlobalIcon,
    href: 'https://www.probit.com/app/exchange/HMT-USDT',
    name: 'Probit Global',
  },
  {
    icon: gateIoIcon,
    href: 'https://gate.io/trade/hmt_usdt',
    name: 'Gate.io',
  },
  // { icon: bingXIcon, href: 'https://www.bingx.com/', name: 'BingX' },
  {
    icon: coinlistProIcon,
    href: 'https://pro.coinlist.co/trader/HMT-USDT',
    name: 'Coinlist Pro',
  },
  {
    icon: lBankIcon,
    href: 'https://www.lbank.com/en-US/trade/hmt_usdt/',
    name: 'LBank',
  },
  {
    icon: mexcIcon,
    href: 'https://www.mexc.com/exchange/HMT_USDT',
    name: 'MEXC',
  },
  {
    icon: bitmartIcon,
    href: 'https://www.bitmart.com/trade/en?symbol=HMT_USDT',
    name: 'Bitmart',
  },
];

const TotalSupplyComponent = ({ value }: { value: number }) => {
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'long',
  });
  const compactNumber = formatter.format(value);
  const [number, unit] = compactNumber.split(' ');

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'baseline',
        mt: 3,
        overflow: 'hidden',
      }}
    >
      <Typography
        variant="h2"
        color="primary"
        lineHeight={1}
        sx={{ fontSize: { xs: 40, xl: 60 } }}
      >
        {number}
      </Typography>
      <Typography
        variant="h4"
        color="primary"
        sx={{
          fontSize: { xs: 28, xl: 34 },
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

export const TokenView: FC = () => {
  const chainId = useChainId();
  const days = useDays();
  const { data } = useHumanAppData(chainId);

  const transferCount = useMemo(() => {
    if (data) {
      return data[0].data[0].attributes.dailyHMTData
        .slice(0, days)
        .reverse()
        .reduce(
          (acc: number, d: any) => acc + Number(d.totalTransactionCount),
          0
        );
    }
  }, [data, days]);

  return (
    <Box>
      <Grid container spacing={{ xs: 2, sm: 2, md: 3, lg: 4, xl: 5 }}>
        <Grid item xs={12} md={4}>
          <CardTextBlock
            title="Total transactions"
            value={transferCount}
            tooltipTitle={TOOLTIPS.TOTAL_TRANSACTIONS}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <CardTextBlock
            title="Holders"
            value={data?.data?.[0]?.attributes?.totalHolders}
            tooltipTitle={TOOLTIPS.HOLDERS}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <CardTextBlock
            title="Total Supply"
            value={
              chainId === ChainId.ALL
                ? 1_000_000_000
                : data?.data?.[0]?.attributes?.totalSupply
            }
            component={TotalSupplyComponent}
            tooltipTitle={TOOLTIPS.TOTAL_SUPPLY}
          />
        </Grid>
      </Grid>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row ' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'flex-end',
          mt: '52px',
          px: { xs: 4, md: 0 },
        }}
      >
        <Typography
          color="primary"
          variant="body2"
          fontWeight={600}
          sx={{
            mr: { xs: 0, md: 4 },
            mb: { xs: 3, md: 0 },
            whiteSpace: 'nowrap',
          }}
        >
          Find HMT at
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexWrap: 'wrap',
          }}
        >
          {EXCHANGES.map(({ icon, href, name }) => (
            <Link
              key={name}
              component="a"
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                minWidth: { xs: '110px', md: 'auto' },
              }}
              href={href}
              target="_blank"
            >
              <img
                src={icon}
                alt={name}
                style={{ width: '32px', height: '32px', borderRadius: '100%' }}
              />
              <Typography
                color="primary"
                sx={{
                  fontSize: '12px',
                  letterSpacing: '0.4px',
                  lineHeight: 1.6,
                  ml: 1,
                }}
              >
                {name}
              </Typography>
            </Link>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
