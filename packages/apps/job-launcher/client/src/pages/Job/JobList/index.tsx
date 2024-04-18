import { ChainId } from '@human-protocol/sdk';
import { Box, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { JobTable } from '../../../components/Jobs/Table';
import { NetworkSelect } from '../../../components/NetworkSelect';
import { JobStatus } from '../../../types';

const JOB_NAV_ITEMS = [
  { status: JobStatus.LAUNCHED, label: 'launched' },
  { status: JobStatus.PARTIAL, label: 'partial' },
  { status: JobStatus.COMPLETED, label: 'completed' },
  { status: JobStatus.PENDING, label: 'pending' },
  { status: JobStatus.CANCELED, label: 'canceled' },
  { status: JobStatus.FAILED, label: 'failed' },
];

export default function JobList() {
  const params = useParams();
  const [chainId, setChainId] = useState<ChainId>(ChainId.ALL);

  useEffect(() => {
    setChainId(ChainId.ALL);
  }, [params.status]);

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
          <NetworkSelect
            showAllNetwork
            value={chainId}
            onChange={(e) => setChainId(e.target.value as ChainId)}
          />
        </Box>
      </Box>
      <JobTable status={item.status} chainId={chainId} />
    </Box>
  );
}
