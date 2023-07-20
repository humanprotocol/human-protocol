import { Box, Button, FormControl, Grid, TextField } from '@mui/material';
import React from 'react';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';

export const FortuneJobRequestForm = () => {
  const { goToNextStep } = useCreateJobPageUI();

  return (
    <Box>
      <Grid container spacing={4} mb={4}>
        <Grid item xs={12} sm={12} md={6}>
          <FormControl fullWidth>
            <TextField placeholder="Title" />
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <FormControl fullWidth>
            <TextField
              placeholder="Fortunes Requested"
              type="number"
              inputProps={{ min: 0, step: 1 }}
            />
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <TextField placeholder="Description" />
          </FormControl>
        </Grid>
      </Grid>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <Button variant="outlined">Cancel</Button>
        <Button
          variant="contained"
          sx={{ ml: 2.5 }}
          onClick={() => goToNextStep?.()}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};
