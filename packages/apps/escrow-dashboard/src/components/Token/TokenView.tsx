import { Box, Link, Grid, Typography } from '@mui/material';
import { FC } from 'react';

import { CardTextBlock } from '../Cards';
import bingXIcon from 'src/assets/exchanges/bingx.png';
import bitfinexIcon from 'src/assets/exchanges/bitfinex.png';
import coinlistProIcon from 'src/assets/exchanges/coinlist-pro.png';
import gateIoIcon from 'src/assets/exchanges/gate-io.png';
import lBankIcon from 'src/assets/exchanges/lbank.svg';
import probitGlobalIcon from 'src/assets/exchanges/probit-global.png';
import { TOOLTIPS } from 'src/constants/tooltips';
import { useHMTStats } from 'src/hooks/useHMTStats';

const EXCHANGES = [
  { icon: bitfinexIcon, href: 'https://www.bitfinex.com/', name: 'Bitfinex' },
  {
    icon: probitGlobalIcon,
    href: 'https://www.probit.com/',
    name: 'Probit Global',
  },
  { icon: gateIoIcon, href: 'https://www.gate.io/', name: 'Gate.io' },
  { icon: bingXIcon, href: 'https://www.bingx.com/', name: 'BingX' },
  {
    icon: coinlistProIcon,
    href: 'https://pro.coinlist.co/trader/HMT-USD',
    name: 'Coinlist Pro',
  },
  { icon: lBankIcon, href: 'https://www.lbank.com/', name: 'LBank' },
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
  const { data } = useHMTStats();

  return (
    <Box>
      <Grid container spacing={{ xs: 2, sm: 2, md: 3, lg: 4, xl: 5 }}>
        <Grid item xs={12} md={4}>
          <CardTextBlock
            title="Amount of transfers"
            value={data?.totalTransferCount}
            tooltipTitle={TOOLTIPS.AMOUNT_OF_TRANSFERS}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <CardTextBlock
            title="Holders"
            value={data?.holders}
            tooltipTitle={TOOLTIPS.AMOUNT_OF_TRANSFERS}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <CardTextBlock
            title="Total Supply"
            value={data?.totalSupply}
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
