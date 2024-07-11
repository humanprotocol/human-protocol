import { Box, Button, Grid, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSnackbar } from '../../providers/SnackProvider';
import { useWalletClient } from 'wagmi';
import * as jobService from '../../services/job';

const SolutionForm: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();

  const { data: signer } = useWalletClient();
  const [solution, setSolution] = useState('');
  const { showError, openSnackbar } = useSnackbar();

  const handleSubmit = async () => {
    const message = {
      solution,
      assignment_id: assignmentId,
    };

    try {
      await jobService.solveJob(signer, message);

      openSnackbar('Solution sent successfully', 'success');
    } catch (error) {
      showError(error);
    }
  };

  return (
    <Box
      width={{ xs: '100%', md: '50%' }}
      minWidth={{ xs: '340px', sm: '392px' }}
      sx={{
        p: 3,
        background: '#fff',
        borderRadius: '16px',
        boxShadow:
          '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
      }}
    >
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Box
            sx={{
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
              background: '#fbfbfe',
              borderRadius: '10px',
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              flexDirection: 'column',
              py: 8,
            }}
          >
            <Typography variant="h4" mb={3}>
              Submit Your Solution
            </Typography>
            <br />
            <br />
            <TextField
              label="Solution"
              variant="outlined"
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              sx={{ mb: 3, width: '300px' }}
            />
            <br />
            <Button variant="contained" onClick={handleSubmit}>
              Submit
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SolutionForm;
