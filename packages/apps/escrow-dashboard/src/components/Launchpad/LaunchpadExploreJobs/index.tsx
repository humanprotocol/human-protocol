import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Chip, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

import { JobTypesView } from './JobTypesView';

export const LaunchpadExploreJobs = () => {
  return (
    <Box>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="start"
        position="relative"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: 0,
            transform: 'translateY(-50%)',
          }}
        >
          <Link to="/launchpad">
            <Button
              variant="text"
              color="primary"
              startIcon={<ArrowBackIcon />}
            >
              Back
            </Button>
          </Link>
        </Box>
        <Typography fontWeight={800} variant="h2" color="primary">
          Launchpad
        </Typography>
        <Chip
          label="NEW"
          sx={{ m: '10px' }}
          variant="outlined"
          color="primary"
        />
      </Box>
      <JobTypesView />
    </Box>
  );
};
