import { Box, Typography } from '@mui/material';
import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { JobsTable } from '../../../components/Jobs/Table';
import { NetworkSelect } from '../../../components/NetworkSelect';
import { SearchField } from '../../../components/SearchField';
import { JOB_STATUS } from '../../../constants';

export default function JobList() {
  const params = useParams();

  if (!JOB_STATUS.includes(params.status!)) {
    return <Navigate to="/jobs/launched" />;
  }

  return (
    <Box>
      <Box
        mb={8}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" fontWeight={600}>
          Jobs{' '}
          <Typography
            variant="h4"
            fontWeight={600}
            component={'span'}
            sx={{ textTransform: 'capitalize' }}
          >
            {params.status}
          </Typography>
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
          <NetworkSelect />
          <SearchField />
        </Box>
      </Box>
      <JobsTable />
    </Box>
  );
}
