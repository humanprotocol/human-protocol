import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from '@mui/material';
import { useFormik } from 'formik';
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import { CvatJobType } from '../../../types';
import { CvatJobRequestValidationSchema } from './schema';

export const CvatJobRequestForm = () => {
  const { jobRequest, updateJobRequest, goToPrevStep, goToNextStep } = useCreateJobPageUI();
  const [searchParams] = useSearchParams();

  const initialValues = {
    labels: [],
    type: CvatJobType.IMAGE_BOXES,
    description: '',
    dataUrl: '',
    groundTruthUrl: '',
    userGuide: '',
    accuracyTarget: 80,
  };

  const handleNext = ({ labels, type, description, dataUrl, groundTruthUrl, userGuide, accuracyTarget }: any) => {
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

  const { errors, touched, values, dirty, isValid, handleSubmit, handleBlur, setFieldValue } = useFormik({
    initialValues,
    validationSchema: CvatJobRequestValidationSchema,
    onSubmit: handleNext,
  });

  useEffect(() => {
    const type = searchParams.get('type');
    if (type && Object.values(CvatJobType).includes(type as CvatJobType)) {
      setFieldValue('type', type);
    }
  }, []);

  return (
    <Box>
      <form>
        <Grid container spacing={4} mb={4}>
          <Grid item xs={12} sm={12} md={6}>
            <FormControl variant="standard" fullWidth sx={{ mb: 2 }}>
              <InputLabel id="cvat-job-type-select-label">Type of job</InputLabel>
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
                <MenuItem value={CvatJobType.IMAGE_BOXES}>Bounding Boxes</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <TextField
                name="description"
                value={values.description}
                onChange={(e) => setFieldValue('description', e.target.value)}
                onBlur={handleBlur}
                placeholder="Description"
                label="Description"
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
                  value.map((option, index) => <Chip label={option} {...props({ index })} />)
                }
                renderInput={(params) => <TextField label="Labels" {...params} />}
                onChange={(e, value) => setFieldValue('labels', value)}
                onBlur={handleBlur}
                placeholder="Labels"
              />
              {errors.labels && (
                <FormHelperText sx={{ mx: '14px', mt: '3px' }} error>
                  {errors.labels}
                </FormHelperText>
              )}
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                name="dataUrl"
                value={values.dataUrl}
                onChange={(e) => setFieldValue('dataUrl', e.target.value)}
                onBlur={handleBlur}
                placeholder="Data URL"
                label="Data URL"
                error={touched.dataUrl && Boolean(errors.dataUrl)}
                helperText={errors.dataUrl}
              />
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                name="groundTruthUrl"
                value={values.groundTruthUrl}
                onChange={(e) => setFieldValue('groundTruthUrl', e.target.value)}
                onBlur={handleBlur}
                placeholder="Reference data for annotation accuracy"
                label="Ground Truth URL"
                error={touched.groundTruthUrl && Boolean(errors.groundTruthUrl)}
                helperText={errors.groundTruthUrl}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="This field should contain a URL or link to the ground truth data. Ground truth data serves as the reference or gold standard for your annotations. It represents the correct or desired data, against which the annotations are compared for accuracy and quality assessment.">
                        <HelpOutlineIcon color="secondary" sx={{ cursor: 'pointer' }} />
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                name="userGuide"
                value={values.userGuide}
                onChange={(e) => setFieldValue('userGuide', e.target.value)}
                onBlur={handleBlur}
                placeholder="Annotator's guideline for data labeling"
                label="User Guide URL"
                error={touched.userGuide && Boolean(errors.userGuide)}
                helperText={errors.userGuide}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="This field should contain a brief description of how data should be annotated. A user guide is a valuable resource that provides instructions, guidelines, and best practices for annotators, helping them understand how to accurately and consistently annotate the data.">
                        <HelpOutlineIcon color="secondary" sx={{ cursor: 'pointer' }} />
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>
            <FormControl fullWidth>
              <TextField
                name="accuracyTarget"
                type="number"
                value={values.accuracyTarget}
                onChange={(e) => setFieldValue('accuracyTarget', e.target.value)}
                onBlur={handleBlur}
                placeholder="Accuracy target %"
                label="Accuracy target %"
                error={touched.accuracyTarget && Boolean(errors.accuracyTarget)}
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
            onClick={() => {
              goToPrevStep?.();
              updateJobRequest?.({
                ...jobRequest,
                chainId: undefined,
              });
            }}
            sx={{ width: '200px' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ ml: 2.5, width: '200px' }}
            onClick={() => handleSubmit()}
            disabled={!(isValid && dirty) || !jobRequest.chainId}
          >
            Next
          </Button>
        </Box>
      </form>
    </Box>
  );
};
