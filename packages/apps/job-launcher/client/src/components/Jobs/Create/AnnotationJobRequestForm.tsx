import { Box, Button, FormControl, Grid, TextField } from '@mui/material';
import { Formik } from 'formik';
import React from 'react';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';

export const AnnotationJobRequestForm = () => {
  const { jobRequest, updateJobRequest, goToPrevStep, goToNextStep } =
    useCreateJobPageUI();

  const initialValues = {
    labels: [],
    description: '',
    dataUrl: '',
    annotationsPerImage: undefined,
    accuracyTarget: undefined,
    rewardToWorkers: undefined,
  };

  const handleNext = ({
    labels,
    description,
    dataUrl,
    annotationsPerImage,
    accuracyTarget,
    rewardToWorkers,
  }: any) => {
    updateJobRequest?.({
      ...jobRequest,
      annotationRequest: {
        labels,
        description,
        dataUrl,
        annotationsPerImage,
        accuracyTarget,
        rewardToWorkers,
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
                    name="labels"
                    value={values.labels}
                    onChange={(e) => setFieldValue('labels', e.target.value)}
                    onBlur={handleBlur}
                    placeholder="Labels"
                    error={touched.labels && Boolean(errors.labels)}
                    helperText={errors.labels}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    name="dataUrl"
                    value={values.dataUrl}
                    onChange={(e) => setFieldValue('dataUrl', e.target.value)}
                    onBlur={handleBlur}
                    placeholder="https://yourdata.url"
                    error={touched.dataUrl && Boolean(errors.dataUrl)}
                    helperText={errors.dataUrl}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
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
                    multiline
                    rows={8}
                  />
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
                    <TextField
                      name="annotationsPerImage"
                      value={values.annotationsPerImage}
                      onChange={(e) =>
                        setFieldValue('annotationsPerImage', e.target.value)
                      }
                      onBlur={handleBlur}
                      placeholder="Annotations per image"
                      error={
                        touched.annotationsPerImage &&
                        Boolean(errors.annotationsPerImage)
                      }
                      helperText={errors.annotationsPerImage}
                    />
                  </FormControl>
                  <FormControl fullWidth>
                    <TextField
                      name="accuracyTarget"
                      value={values.accuracyTarget}
                      onChange={(e) =>
                        setFieldValue('accuracyTarget', e.target.value)
                      }
                      onBlur={handleBlur}
                      placeholder="Accuracy target %"
                      error={
                        touched.accuracyTarget && Boolean(errors.accuracyTarget)
                      }
                      helperText={errors.accuracyTarget}
                    />
                  </FormControl>
                  <FormControl fullWidth>
                    <TextField
                      name="rewardToWorkers"
                      value={values.rewardToWorkers}
                      onChange={(e) =>
                        setFieldValue('rewardToWorkers', e.target.value)
                      }
                      onBlur={handleBlur}
                      placeholder="Reward to workers"
                      error={
                        touched.rewardToWorkers &&
                        Boolean(errors.rewardToWorkers)
                      }
                      helperText={errors.rewardToWorkers}
                    />
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
