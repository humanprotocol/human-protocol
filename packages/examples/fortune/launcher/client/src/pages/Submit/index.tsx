import { Button, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import React, { useState } from 'react';

export default function SubmitPage() {
  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }, pt: 10 }}>
      <Box
        sx={{
          background: '#f6f7fe',
          borderRadius: {
            xs: '16px',
            sm: '16px',
            md: '24px',
            lg: '32px',
            xl: '40px',
          },
          padding: {
            xs: '24px 16px',
            md: '42px 54px',
            lg: '56px 72px',
            xl: '70px 90px',
          },
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
        >
          <Typography variant="h4" fontWeight={600}>
            Fortune Jobs
          </Typography>
          <Button variant="outlined">Back</Button>
        </Box>
      </Box>
    </Box>
  );
}
