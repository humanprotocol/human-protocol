import {
  Grid,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import React, { Dispatch } from 'react';
export const ImportPubkey = ({ setStep }: { setStep: Dispatch<number> }) => {
  return (
    <Paper>
      <Grid container direction="column">
        <Grid
          item
          container
          direction="column"
          alignItems="flex-start"
          justifyContent="center"
          sx={{ paddingLeft: 5, paddingTop: 5 }}
        >
          <Typography sx={{ marginTop: 3 }} variant="h6" color="primary">
            Success!
          </Typography>
          <Typography variant="body2" color="primary">
            Your public key has been uploaded
          </Typography>
          <Typography sx={{ marginTop: 3 }} variant="body2" color="primary">
            Add your public key file
          </Typography>
          <Grid
            container
            sx={{ my: { lg: 1, xl: 1 }, paddingRight: { xs: 1, sm: 1, lg: 5 } }}
          >
            <Paper
              sx={{
                backgroundColor: '#f6f7fe',
                width: { lg: 600, xl: 600 },
                padding: 2,
                marginTop: 2,
              }}
            >
              <Grid container justifyContent="center">
                <Button variant="outlined" startIcon={<UploadFileIcon />}>
                  Select or drop file
                </Button>
              </Grid>
            </Paper>
          </Grid>
          <Typography sx={{ marginTop: 3 }} variant="body2" color="primary">
            Add your public key file from github
          </Typography>
          <Grid
            container
            sx={{ my: { lg: 1, xl: 1 }, paddingRight: { xs: 1, sm: 1, lg: 5 } }}
          >
            <Paper
              sx={{
                backgroundColor: '#f6f7fe',
                width: { lg: 600, xl: 600 },
                padding: 2,
                marginTop: 2,
              }}
            >
              <Grid container justifyContent="center">
                <TextField
                  sx={{ width: { lg: 200, xl: 200 } }}
                  id="outlined-basic"
                  label="Github username"
                  variant="outlined"
                />
              </Grid>
              <Grid container justifyContent="center">
                <Button variant="outlined" sx={{ mx: 2, mt: 2 }}>
                  Add public key
                </Button>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <Grid
          item
          container
          direction="row"
          justifyContent="flex-end"
          alignItems="flex-end"
          sx={{
            marginTop: { xs: 1, sm: 1, lg: 10 },
            paddingRight: { xs: 1, sm: 1, lg: 5 },
            marginBottom: { xs: 1, sm: 1, lg: 7 },
          }}
        >
          <Button variant="outlined" sx={{ mr: 2 }} onClick={() => setStep(0)}>
            Back
          </Button>
          <Button variant="contained" sx={{ marginRight: 2 }}>
            Import Public Key
          </Button>
          <Button variant="contained">Add to ETH - KV Store</Button>
        </Grid>
      </Grid>
    </Paper>
  );
};
