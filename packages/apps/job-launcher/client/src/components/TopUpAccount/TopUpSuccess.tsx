import { Box, Button, Typography } from '@mui/material';
import React from 'react';
import { CheckFilledIcon } from '../../components/Icons/CheckFilledIcon';

export const TopUpSuccess = () => {
  return (
    <Box
      sx={{
        py: '128px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Box>
        <CheckFilledIcon />
      </Box>
      <Typography variant="h6" fontWeight={500}>
        Success!
      </Typography>
      <Typography variant="body2" mt={2}>
        You have successfully added funds to your account.
      </Typography>
      <Box mt={4}>
        <Button size="large" variant="contained" color="primary">
          Go to dashboard
        </Button>
      </Box>
    </Box>
  );
};
