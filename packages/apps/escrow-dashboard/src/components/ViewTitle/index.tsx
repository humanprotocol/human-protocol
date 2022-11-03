import { Box, Typography } from '@mui/material';
import React from 'react';

interface ICategoryProps {
  title: string;
  iconUrl: string;
}

export default function ViewTitle({ title, iconUrl }: ICategoryProps) {
  return (
    <Box display="flex" alignItems="center">
      <Box
        sx={{
          display: 'flex',
          position: 'relative',
          height: '85px',
          width: '85px',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '85px',
            height: '85px',
            borderRadius: '100%',
            background:
              'linear-gradient(12.79deg, #F7F8FD 20.33%, #FFFFFF 48.75%)',
            boxShadow: '0px 24px 32px rgba(12, 32, 213, 0.06)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '85px',
            height: '85px',
            borderRadius: '100%',
            background:
              'radial-gradient(83.8% 83.8% at 50% 16.2%, #F0F0FF 0%, #F1F1FD 0%, #FFFFFF 70.31%);',
            boxShadow: '0px 24px 32px rgba(12, 32, 213, 0.06)',
          }}
        />
        <img src={iconUrl} alt="network" style={{ zIndex: 100 }} />
      </Box>
      <Typography variant="h4" color="primary" ml="30px">
        {title}
      </Typography>
    </Box>
  );
}
