import {
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { Formik } from 'formik';
import React from 'react';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import { CvatJobType } from '../../../types';
import { CvatJobRequestValidationSchema } from './schema';

export const CvatJobRequestForm = () => {
  const { jobRequest, updateJobRequest, goToPrevStep, goToNextStep } =
    useCreateJobPageUI();

  const initialValues = {
    labels: [],
    type: CvatJobType.IMAGE_POINTS,
    description: '',
    dataUrl: '',
    groundTruthUrl: '',
    userGuide: '',
    accuracyTarget: 80,
  };

  const handleNext = ({
    labels,
    type,
    description,
    dataUrl,
    groundTruthUrl,
    userGuide,
    accuracyTarget,
  }: any) => {
    updateJobRequest?.({
      ...jobRequest,
      cvatRequest: {
        labels,
        type,
        description,
        dataUrl,
        groundTruthUrl,
        userGuide,
        accuracyTarget,
      },
    });
    goToNextStep?.();
  };

  return (
    <Box>
      <Formik
        initialValues={initialValues}
        validationSchema={CvatJobRequestValidationSchema}
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
                <FormControl variant="standard" fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="cvat-job-type-select-label">
                    Type of job
                  </InputLabel>
                  <Select
                    labelId="cvat-job-type-select-label"
                    id="cvat-job-type-select"
                    label="Type"
                    sx={{
                      '.MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        paddingTop: '8px',
                        paddingBottom: '8px',
                        minWidth: '300px',
                        '.MuiListItemIcon-root': {
                          minWidth: '36px',
                        },
                      },
                    }}
                    value={values.type}
                    onChange={(e) => setFieldValue('type', e.target.value)}
                    error={touched.type && Boolean(errors.type)}
                    onBlur={handleBlur}
                  >
                    <MenuItem value={CvatJobType.IMAGE_POINTS}>Points</MenuItem>
                    <MenuItem value={CvatJobType.IMAGE_BOXES}>
                      Bounding Boxes
                    </MenuItem>
                  </Select>
                </FormControl>
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
                    rows={11}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <Autocomplete
                    clearIcon={false}
                    options={[]}
                    freeSolo
                    multiple
                    renderTags={(value, props) =>
                      value.map((option, index) => (
                        <Chip label={option} {...props({ index })} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField label="Labels" {...params} />
                    )}
                    onChange={(e, value) => setFieldValue('labels', value)}
                    onBlur={handleBlur}
                    placeholder="Labels"
                  />
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <TextField
                    name="dataUrl"
                    value={values.dataUrl}
                    onChange={(e) => setFieldValue('dataUrl', e.target.value)}
                    onBlur={handleBlur}
                    placeholder="Data URL"
                    error={touched.dataUrl && Boolean(errors.dataUrl)}
                    helperText={errors.dataUrl}
                  />
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <TextField
                    name="groundTruthUrl"
                    value={values.groundTruthUrl}
                    onChange={(e) =>
                      setFieldValue('groundTruthUrl', e.target.value)
                    }
                    onBlur={handleBlur}
                    placeholder="Ground Truth URL"
                    error={
                      touched.groundTruthUrl && Boolean(errors.groundTruthUrl)
                    }
                    helperText={errors.groundTruthUrl}
                  />
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <TextField
                    name="userGuide"
                    value={values.userGuide}
                    onChange={(e) => setFieldValue('userGuide', e.target.value)}
                    onBlur={handleBlur}
                    placeholder="User Guide"
                    error={touched.userGuide && Boolean(errors.userGuide)}
                    helperText={errors.userGuide}
                  />
                </FormControl>
                <FormControl fullWidth>
                  <TextField
                    name="accuracyTarget"
                    type="number"
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
