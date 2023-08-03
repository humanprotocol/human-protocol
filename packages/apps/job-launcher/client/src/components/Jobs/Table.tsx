import { Box, Button, IconButton, Typography } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { CopyLinkIcon } from '../../components/Icons/CopyLinkIcon';
import { Table } from '../../components/Table';

export const JobTable = ({ data }: { data: Array<any> }) => {
  const navigate = useNavigate();

  return (
    <Table
      columns={[
        {
          id: 'address',
          label: 'Address',
          sortable: true,
          render: ({ address }) => (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {address}
              <IconButton color="primary" sx={{ ml: 3 }}>
                <CopyLinkIcon />
              </IconButton>
            </Box>
          ),
        },
        { id: 'network', label: 'Network', sortable: true },
        {
          id: 'balance',
          label: 'Balance',
          sortable: true,
          render: ({ balance }) => `${balance} HMT`,
        },
        { id: 'status', label: 'Status' },
        {
          id: 'action',
          label: '',
          render: (row) => (
            <Link
              style={{ fontWeight: 600, textDecoration: 'underline' }}
              to="/jobs/details/1"
            >
              Details
            </Link>
          ),
        },
      ]}
      data={data}
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
