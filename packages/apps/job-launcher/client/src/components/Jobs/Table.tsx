import { Box, Button, IconButton, Typography } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { CopyLinkIcon } from '../../components/Icons/CopyLinkIcon';
import { Table } from '../../components/Table';
import { CHAIN_ID_BY_NAME } from '../../constants/chains';
import { useJobs } from '../../hooks/useJobs';
import { JobStatus } from '../../types';

export const JobTable = ({ status }: { status: JobStatus }) => {
  const navigate = useNavigate();
  const { data, isLoading } = useJobs(status);

  return (
    <Table
      columns={[
        {
          id: 'address',
          label: 'Address',
          sortable: true,
          render: ({ address }) =>
            address ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {address}
                <IconButton color="primary" sx={{ ml: 3 }}>
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
          label: 'Balance',
          sortable: true,
          render: ({ fundAmount }) => `${fundAmount} HMT`,
        },
        { id: 'status', label: 'Status' },
        {
          id: 'action',
          label: '',
          render: ({ network, address }) => (
            <Link
              style={{ fontWeight: 600, textDecoration: 'underline' }}
              to={`/jobs/details/${CHAIN_ID_BY_NAME[network]}/${address}`}
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
