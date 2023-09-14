import { Box, Button, FormControl, Grid, TextField } from '@mui/material';
import { Formik } from 'formik';
import React from 'react';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';

export const FortuneJobRequestForm = () => {
  const { jobRequest, updateJobRequest, goToPrevStep, goToNextStep } =
    useCreateJobPageUI();

  const initialValues = {
    title: '',
    fortunesRequested: undefined,
    description: '',
  };

  const handleNext = ({ title, fortunesRequested, description }: any) => {
    updateJobRequest?.({
      ...jobRequest,
      fortuneRequest: {
        title,
        fortunesRequested,
        description,
      },
    });
    goToNextStep?.();
  };

  return (
    <Box>
      <Formik
        initialValues={initialValues}
        // validationSchema={RegisterValidationSchema}
        onSubmit={handleNext}
      >
        {({
          errors,
          touched,
          values,
          dirty,
          isValid,
          handleSubmit,
          handleBlur,
          setFieldValue,
        }) => (
          <form>
            <Grid container spacing={4} mb={4}>
              <Grid item xs={12} sm={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    name="title"
                    value={values.title}
                    onChange={(e) => setFieldValue('title', e.target.value)}
                    onBlur={handleBlur}
                    placeholder="Title"
                    error={touched.title && Boolean(errors.title)}
                    helperText={errors.title}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    name="fortunesRequested"
                    value={values.fortunesRequested}
                    onChange={(e) =>
                      setFieldValue('fortunesRequested', e.target.value)
                    }
                    onBlur={handleBlur}
                    placeholder="Fortunes Requested"
                    type="number"
                    inputProps={{ min: 0, step: 1 }}
                    error={
                      touched.fortunesRequested &&
                      Boolean(errors.fortunesRequested)
                    }
                    helperText={errors.fortunesRequested}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <TextField
                    name="description"
                    value={values.description}
                    onChange={(e) =>
                      setFieldValue('description', e.target.value)
                    }
                    onBlur={handleBlur}
                    placeholder="Description"
                    error={touched.description && Boolean(errors.description)}
                    helperText={errors.description}
                  />
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
              <Button
                variant="outlined"
                onClick={() => goToPrevStep?.()}
                sx={{ width: '200px' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                sx={{ ml: 2.5, width: '200px' }}
                onClick={() => handleSubmit()}
                disabled={!(isValid && dirty)}
              >
                Next
              </Button>
            </Box>
          </form>
        )}
      </Formik>
    </Box>
  );
};
