import { Box, Button, Grid, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSnackbar } from '../../providers/SnackProvider';
import { useAccount, useWalletClient } from 'wagmi';
import * as jobService from '../../services/job';

const SolutionForm: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();

  const { address, chainId, connector, isConnected } = useAccount();
  const { data: signer } = useWalletClient({
    account: address,
    chainId,
    connector,
    query: {
      enabled: isConnected && !!address && !!connector,
    },
  });
  const [solution, setSolution] = useState('');

  type SnackbarApi = {
    openSnackbar: (
      message: string,
      severity?: 'success' | 'error' | 'info' | 'warning',
    ) => void;
    showError: (error: unknown) => void;
  };

  const { showError, openSnackbar } = useSnackbar() as SnackbarApi;

  const handleSubmit = async () => {
    if (!signer) {
      openSnackbar('Please connect your wallet first', 'error');
      return;
    }

    if (!assignmentId) {
      openSnackbar('Missing assignment id', 'error');
      return;
    }
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
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!signer || !assignmentId || !solution}
            >
              Submit
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SolutionForm;
