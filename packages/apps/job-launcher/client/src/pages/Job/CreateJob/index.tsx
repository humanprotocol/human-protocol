import { Box, Typography } from '@mui/material';
import React from 'react';
import { CreateJobView } from '../../../components/Jobs/Create';
import { CreateJobSteps } from '../../../components/Jobs/Create/CreateJobSteps';
import { CreateJobPageUIProvider } from '../../../providers/CreateJobPageUIProvider';

export default function CreateJob() {
  return (
    <Box sx={{ width: '80%', mt: 3, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={600}>
        Add New Job
      </Typography>
      <Box mt={9}>
        <CreateJobPageUIProvider>
          <Box>
            <CreateJobSteps />
            <CreateJobView />
          </Box>
        </CreateJobPageUIProvider>
      </Box>
    </Box>
  );
}
