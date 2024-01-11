import { ChainId } from '@human-protocol/sdk';
import { Box, Button, IconButton, Typography } from '@mui/material';
import copy from 'copy-to-clipboard';
import { Link, useNavigate } from 'react-router-dom';
import { CopyLinkIcon } from '../../components/Icons/CopyLinkIcon';
import { Table } from '../../components/Table';
import { useJobs } from '../../hooks/useJobs';
import { JobStatus } from '../../types';

export const JobTable = ({
  status,
  chainId,
}: {
  status: JobStatus;
  chainId: ChainId;
}) => {
  const { data, isLoading } = useJobs({ status, chainId });
  const navigate = useNavigate();

  return (
    <Table
      columns={[
        {
          id: 'escrowAddress',
          label: 'Address',
          sortable: true,
          render: ({ escrowAddress }) =>
            escrowAddress ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {escrowAddress}
                <IconButton
                  color="primary"
                  sx={{ ml: 3 }}
                  onClick={() => copy(escrowAddress)}
                >
                  <CopyLinkIcon />
                </IconButton>
              </Box>
            ) : (
              <></>
            ),
        },
        { id: 'network', label: 'Network', sortable: true },
        {
          id: 'fundAmount',
          label: 'Fund Amount',
          sortable: true,
          render: ({ fundAmount }) => `${fundAmount} HMT`,
        },
        { id: 'status', label: 'Status' },
        {
          id: 'action',
          label: '',
          render: ({ jobId }) => (
            <Link
              style={{ fontWeight: 600, textDecoration: 'underline' }}
              to={`/jobs/details/${jobId}`}
            >
              Details
            </Link>
          ),
        },
      ]}
      data={data}
      loading={isLoading}
      emptyCell={
        <>
          <Typography variant="h5">
            There are no Jobs at the moment, click the button
            <br /> below to create a new Job
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{ mt: 3 }}
            onClick={() => navigate('/jobs/create')}
          >
            + Create a Job
          </Button>
        </>
      }
    />
  );
};
