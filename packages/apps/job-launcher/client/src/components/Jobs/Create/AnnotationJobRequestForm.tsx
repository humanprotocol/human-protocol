import { Box, Button, FormControl, Grid, TextField } from '@mui/material';
import React from 'react';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';

export const AnnotationJobRequestForm = () => {
  const { goToNextStep } = useCreateJobPageUI();

  return (
    <Box>
      <Grid container spacing={4} mb={4}>
        <Grid item xs={12} sm={12} md={6}>
          <FormControl fullWidth>
            <TextField placeholder="Labels" />
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <FormControl fullWidth>
            <TextField placeholder="https://yourdata.url" />
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <FormControl fullWidth>
            <TextField placeholder="Description" multiline rows={8} />
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              boxSizing: 'border-box',
            }}
          >
            <FormControl fullWidth>
              <TextField placeholder="Annotation per image" />
            </FormControl>
            <FormControl fullWidth>
              <TextField placeholder="Accuracy target %" />
            </FormControl>
            <FormControl fullWidth>
              <TextField placeholder="Reward to workers" />
            </FormControl>
          </Box>
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
