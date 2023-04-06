import { Box, Typography } from '@mui/material';
import numeral from 'numeral';
import React, { FC } from 'react';
import { Container } from '../Cards/Container';
import { PolygonIcon } from '../Icons';

type StakeCardProps = {
  title: string;
  hmt: number;
  usd: number;
};

export const StakeCard: FC<StakeCardProps> = ({ title, hmt, usd }) => {
  return (
    <Container p={4}>
      <Typography color="primary" fontWeight={500} gutterBottom ml={1}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
        <Typography color="primary" fontWeight={600} variant="h3">
          {numeral(hmt).format('0.00')}
        </Typography>
        <Typography color="primary" variant="body2" ml={0.5}>
          HMT
        </Typography>
      </Box>
      <Typography
        color="textSecondary"
        variant="body2"
        fontWeight={600}
        ml={1}
        mb={2}
      >
        {numeral(usd).format('$0.00')}
      </Typography>
      <Box display="flex">
        <Box
          sx={{
            background: '#f9faff',
            borderRadius: '4px',
            padding: '9px',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <PolygonIcon color="primary" />
          <Typography color="primary">Polygon</Typography>
        </Box>
      </Box>
    </Container>
  );
};
