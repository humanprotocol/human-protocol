import { Box, CircularProgress, Link, Grid, Typography } from '@mui/material';
import { FC } from 'react';

import { CardTextBlock } from '../Cards';
import bingXIcon from 'src/assets/exchanges/bingx.png';
import bitfinexIcon from 'src/assets/exchanges/bitfinex.png';
import coinlistProIcon from 'src/assets/exchanges/coinlist-pro.png';
import gateIoIcon from 'src/assets/exchanges/gate-io.png';
import lBankIcon from 'src/assets/exchanges/lbank.svg';
import probitGlobalIcon from 'src/assets/exchanges/probit-global.png';
import {
  useTokenStatsByChainId,
  useTokenStatsLoaded,
} from 'src/state/token/hooks';

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
          sx={{ fontSize: { xs: 32, md: 42, xl: 60 } }}
        >
          {number}
        </Typography>
        <Typography
          variant="h4"
          color="primary"
          sx={{
            fontSize: { xs: 20, md: 28, xl: 34 },
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
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          mt: '52px',
          pr: 3,
        }}
      >
        <Typography
          color="primary"
          variant="body2"
          fontWeight={600}
          sx={{ mr: 4, whiteSpace: 'nowrap' }}
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
