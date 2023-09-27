import { Box, Button, Typography } from '@mui/material';
import React from 'react';
import { CheckFilledIcon } from '../../../components/Icons/CheckFilledIcon';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';

export const LaunchSuccess = () => {
  const { reset } = useCreateJobPageUI();

  return (
    <Box
      sx={{
        background: '#fff',
        borderRadius: '16px',
        boxShadow:
          '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
        py: '180px',
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
        Your request has been submitted
      </Typography>
      <Box mt={4}>
        <Button
          size="large"
          variant="contained"
          color="primary"
          sx={{ width: 240 }}
          onClick={() => reset?.()}
        >
          Add New Job
        </Button>
      </Box>
    </Box>
  );
};
