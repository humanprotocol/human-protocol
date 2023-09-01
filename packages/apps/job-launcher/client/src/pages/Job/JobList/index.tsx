import { Box, Typography } from '@mui/material';
import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { JobTable } from '../../../components/Jobs/Table';
import { NetworkSelect } from '../../../components/NetworkSelect';
import { SearchField } from '../../../components/SearchField';
import { JobStatus } from '../../../types';

const JOB_NAV_ITEMS = [
  { status: JobStatus.LAUNCHED, label: 'launched' },
  { status: JobStatus.PENDING, label: 'pending' },
  // { status: JobStatus.PAID, label: 'completed' },
  { status: JobStatus.CANCELED, label: 'cancelled' },
  { status: JobStatus.FAILED, label: 'failed' },
];

export default function JobList() {
  const params = useParams();

  const item = JOB_NAV_ITEMS.find((x) => x.label === params.status);
  if (!item) {
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
            {item.label}
          </Typography>
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
          <NetworkSelect />
          <SearchField />
        </Box>
      </Box>
      <JobTable status={item.status} />
    </Box>
  );
}
