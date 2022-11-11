import { Box, Typography, useTheme } from '@mui/material';
import React from 'react';
import useHMTData from 'src/hooks/useHMTData';

export default function TokenPriceIndicator() {
  const theme = useTheme();
  const data = useHMTData();

  if (!data) return null;

  const { currentPriceInUSD, priceChangePercentage24h } = data;

  return (
    <Box
      sx={{
        borderRadius: '4px',
        overflow: 'hidden',
        background: '#f6f7fe',
        display: 'flex',
      }}
    >
      <Box
        sx={{
          background: theme.palette.primary.main,
          fontSize: 12,
          fontWeight: 600,
          padding: '6px 12px',
        }}
      >
        HMT
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', px: '16px' }}>
        <Typography variant="caption" color="primary">
          ${currentPriceInUSD.toFixed(2)}
        </Typography>
        {priceChangePercentage24h >= 0 ? (
          <Typography variant="caption" color="success.dark" ml="4px">
            (+{Math.abs(priceChangePercentage24h).toFixed(2)}%)
          </Typography>
        ) : (
          <Typography variant="caption" color="error.dark" ml="4px">
            (-{Math.abs(priceChangePercentage24h).toFixed(2)}%)
          </Typography>
        )}
      </Box>
    </Box>
  );
}
