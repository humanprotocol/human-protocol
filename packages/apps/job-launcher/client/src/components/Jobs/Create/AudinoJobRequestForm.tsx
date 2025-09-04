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
  Typography,
} from '@mui/material';
import { useFormik } from 'formik';
import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from '../../../components/Accordion';
import { CollectionsFilledIcon } from '../../../components/Icons/CollectionsFilledIcon';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import { getQualifications } from '../../../services/qualification';
import {
  AudinoJobType,
  AWSRegions,
  GCSRegions,
  Qualification,
  StorageProviders,
} from '../../../types';
import { mapAudinoFormValues } from './helpers';
import { AudinoJobRequestValidationSchema } from './schema';

export const AudinoJobRequestForm = () => {
  const { jobRequest, updateJobRequest, goToPrevStep, goToNextStep } =
    useCreateJobPageUI();
  const [expanded, setExpanded] = useState<string[]>(['panel1']);
  const [qualificationsOptions, setQualificationsOptions] = useState<
    Qualification[]
  >([]);

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
      if (newExpanded) {
        setExpanded([...expanded, panel]);
      } else {
        setExpanded(expanded.filter((item) => item !== panel));
      }
    };

  const persistedFormValues = mapAudinoFormValues(
    jobRequest,
    qualificationsOptions,
  );

  const initialValues = { ...persistedFormValues };

  useEffect(() => {
    const fetchData = async () => {
      if (jobRequest.chainId !== undefined) {
        try {
          setQualificationsOptions(await getQualifications(jobRequest.chainId));
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };

    fetchData();
  }, [jobRequest.chainId]);

  const handleNext = ({
    type,
    labels,
    description,
    qualifications,
    dataProvider,
    dataRegion,
    dataBucketName,
    dataPath,
    gtProvider,
    gtRegion,
    gtBucketName,
    gtPath,
    userGuide,
    accuracyTarget,
    segmentDuration,
  }: ReturnType<typeof mapAudinoFormValues>) => {
    updateJobRequest({
      ...jobRequest,
      audinoRequest: {
        labels: labels.map((name: string) => ({ name })),
        type,
        description,
        qualifications: (qualifications as Qualification[]).map(
          (qualification) => qualification.reference,
        ),
        data: {
          dataset: {
            provider: dataProvider,
            region: dataRegion,
            bucketName: dataBucketName,
            path: dataPath,
          },
        },
        groundTruth: {
          provider: gtProvider,
          region: gtRegion,
          bucketName: gtBucketName,
          path: gtPath,
        },
        userGuide,
        accuracyTarget,
        segmentDuration,
      },
    });
    goToNextStep();
  };

  const {
    errors,
    touched,
    values,
    dirty,
    isValid,
    handleSubmit,
    handleBlur,
    setFieldValue,
  } = useFormik({
    initialValues,
    validationSchema: AudinoJobRequestValidationSchema,
    onSubmit: handleNext,
    validateOnChange: true,
    validateOnMount: true,
  });

  const dataRegions =
    values.dataProvider === StorageProviders.AWS ? AWSRegions : GCSRegions;

  const gtRegions =
    values.gtProvider === StorageProviders.AWS ? AWSRegions : GCSRegions;

  return (
    <Box sx={{ mt: '42px' }}>
      <form>
        <Accordion
          expanded={expanded.includes('panel1')}
          onChange={handleChange('panel1')}
        >
          <AccordionSummary aria-controls="panel1d-content" id="panel1d-header">
            <CollectionsFilledIcon />
            <Typography variant="body2" fontWeight={700} ml={2}>
              General
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12} md={6}>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel id="cvat-job-type-select-label">
                    Type of job
                  </InputLabel>
                  <Select
                    labelId="cvat-job-type-select-label"
                    id="cvat-job-type-select"
                    label="Type of job"
                    value={values.type}
                    onChange={(e) => {
                      setFieldValue('type', e.target.value);
                    }}
                    error={touched.type && Boolean(errors.type)}
                    onBlur={handleBlur}
                  >
                    <MenuItem value={AudinoJobType.AUDIO_TRANSCRIPTION}>
                      Audio transcription
                    </MenuItem>
                    <MenuItem value={AudinoJobType.AUDIO_ATTRIBUTE_ANNOTATION}>
                      Audio attribute annotation
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <FormControl fullWidth>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[]}
                    value={values.labels}
                    onChange={(event, newValues) => {
                      const updatedLabels = (newValues as string[]).map(
                        (label: string) =>
                          label.startsWith('Add: ')
                            ? label.replace('Add: ', '')
                            : label,
                      );
                      setFieldValue('labels', updatedLabels);
                    }}
                    filterOptions={(options: any, params) => {
                      const filtered = options;
                      const { inputValue } = params;
                      if (inputValue !== '' && !options.includes(inputValue)) {
                        filtered.push('Add: ' + inputValue);
                      }
                      return filtered;
                    }}
                    selectOnFocus
                    onBlur={handleBlur}
                    handleHomeEndKeys
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip label={option} {...getTagProps({ index })} />
                      ))
                    }
                    renderInput={(params) => (
                      <Box display="flex" alignItems="center" width="100%">
                        <TextField
                          {...params}
                          label="Labels"
                          variant="outlined"
                          onBlur={handleBlur}
                          fullWidth
                        />
                      </Box>
                    )}
                  />
                  {errors.labels && (
                    <FormHelperText sx={{ mx: '14px', mt: '3px' }} error>
                      {errors.labels}
                    </FormHelperText>
                  )}
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
                    label="Description"
                    error={touched.description && Boolean(errors.description)}
                    helperText={errors.description}
                    multiline
                    rows={4}
                  />
                </FormControl>
              </Grid>
              <Grid item container xs={12} mt={0} spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex">
                    <Typography variant="body2" fontWeight={700}>
                      Qualifications
                    </Typography>
                    <Tooltip title="Specify the required credentials or qualifications workers must have to get access to this job (e.g., english).">
                      <HelpOutlineIcon
                        color="secondary"
                        sx={{ cursor: 'pointer', ml: 1 }}
                      />
                    </Tooltip>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <Autocomplete
                      multiple
                      options={qualificationsOptions}
                      getOptionLabel={(option) => option.title}
                      value={values.qualifications}
                      onChange={(event, newValues) => {
                        setFieldValue('qualifications', newValues);
                      }}
                      selectOnFocus
                      onBlur={handleBlur}
                      handleHomeEndKeys
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            label={option.title}
                            {...getTagProps({ index })}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <Box display="flex" alignItems="center" width="100%">
                          <TextField
                            {...params}
                            label="Qualifications"
                            variant="outlined"
                            onBlur={handleBlur}
                            fullWidth
                          />
                        </Box>
                      )}
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded.includes('panel2')}
          onChange={handleChange('panel2')}
        >
          <AccordionSummary aria-controls="panel2d-content" id="panel2d-header">
            <CollectionsFilledIcon />
            <Typography variant="body2" fontWeight={700} ml={2}>
              Job annotation details
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={4}>
              <Grid item container xs={12} spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" fontWeight={700}>
                    Datasets
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={12} md={6}>
                  <FormControl variant="outlined" fullWidth>
                    <InputLabel id="cvat-data-storage-provider-select-label">
                      Storage Provider
                    </InputLabel>
                    <Select
                      labelId="cvat-data-storage-provider-select-label"
                      id="cvat-data-storage-provider-select"
                      label="Storage Provider"
                      value={values.dataProvider}
                      onChange={(e) =>
                        setFieldValue('dataProvider', e.target.value)
                      }
                      error={
                        touched.dataProvider && Boolean(errors.dataProvider)
                      }
                      onBlur={handleBlur}
                    >
                      {Object.values(StorageProviders).map((provider) => (
                        <MenuItem key={provider} value={provider}>
                          {provider.toUpperCase()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={12} md={6}>
                  <FormControl variant="outlined" fullWidth>
                    <InputLabel id="cvat-data-storage-provider-select-label">
                      Region
                    </InputLabel>
                    <Select
                      labelId="cvat-data-storage-provider-select-label"
                      id="cvat-data-storage-provider-select"
                      label="Region"
                      value={values.dataRegion}
                      onChange={(e) =>
                        setFieldValue('dataRegion', e.target.value)
                      }
                      error={touched.dataRegion && Boolean(errors.dataRegion)}
                      onBlur={handleBlur}
                    >
                      {Object.values(dataRegions).map((region) => (
                        <MenuItem key={`dataset-${region}`} value={region}>
                          {region}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.dataRegion && (
                      <FormHelperText sx={{ mx: '14px', mt: '3px' }} error>
                        {errors.dataRegion}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={12} md={6}>
                  <FormControl fullWidth>
                    <TextField
                      name="dataBucketName"
                      label="Bucket Name"
                      placeholder="Bucket Name"
                      value={values.dataBucketName}
                      onBlur={handleBlur}
                      onChange={(e) =>
                        setFieldValue('dataBucketName', e.target.value)
                      }
                      error={
                        touched.dataBucketName && Boolean(errors.dataBucketName)
                      }
                      helperText={errors.dataBucketName}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={12} md={6}>
                  <FormControl fullWidth>
                    <TextField
                      name="dataPath"
                      label="Path"
                      placeholder="Path"
                      value={values.dataPath}
                      onBlur={handleBlur}
                      onChange={(e) =>
                        setFieldValue('dataPath', e.target.value)
                      }
                      error={touched.dataPath && Boolean(errors.dataPath)}
                      helperText={errors.dataPath}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="This field should contain the relative path to the data, excluding protocol symbols like '://'. For example, if the full URL is 'https://bucket.com/bucket_name/data', the input should only include 'data'.">
                              <HelpOutlineIcon
                                color="secondary"
                                sx={{ cursor: 'pointer' }}
                              />
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </FormControl>
                </Grid>
              </Grid>
              <Grid item container xs={12} spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex">
                    <Typography variant="body2" fontWeight={700}>
                      Ground truth
                    </Typography>
                    <Tooltip title="Ground truth data serves as the reference or gold standard for your annotations, representing the correct data against which annotations are compared for accuracy and quality assessment.">
                      <HelpOutlineIcon
                        color="secondary"
                        sx={{ cursor: 'pointer', ml: 1 }}
                      />
                    </Tooltip>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={12} md={6}>
                  <FormControl variant="outlined" fullWidth>
                    <InputLabel id="cvat-groundtruths-storage-provider-select-label">
                      Storage Provider
                    </InputLabel>
                    <Select
                      labelId="cvat-groundtruths-storage-provider-select-label"
                      id="cvat-groundtruths-storage-provider-select"
                      label="Storage Provider"
                      value={values.gtProvider}
                      onChange={(e) =>
                        setFieldValue('gtProvider', e.target.value)
                      }
                      error={touched.gtProvider && Boolean(errors.gtProvider)}
                      onBlur={handleBlur}
                    >
                      {Object.values(StorageProviders).map((provider) => (
                        <MenuItem key={provider} value={provider}>
                          {provider.toUpperCase()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={12} md={6}>
                  <FormControl variant="outlined" fullWidth>
                    <InputLabel id="cvat-data-storage-provider-select-label">
                      Region
                    </InputLabel>
                    <Select
                      labelId="cvat-data-storage-provider-select-label"
                      id="cvat-data-storage-provider-select"
                      label="Region"
                      value={values.gtRegion}
                      onChange={(e) =>
                        setFieldValue('gtRegion', e.target.value)
                      }
                      error={touched.gtRegion && Boolean(errors.gtRegion)}
                      onBlur={handleBlur}
                    >
                      {Object.values(gtRegions).map((region) => (
                        <MenuItem key={`gt-${region}`} value={region}>
                          {region}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.gtRegion && (
                      <FormHelperText sx={{ mx: '14px', mt: '3px' }} error>
                        {errors.gtRegion}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={12} md={6}>
                  <FormControl fullWidth>
                    <TextField
                      name="gtBucketName"
                      label="Bucket Name"
                      placeholder="Bucket Name"
                      value={values.gtBucketName}
                      onBlur={handleBlur}
                      onChange={(e) =>
                        setFieldValue('gtBucketName', e.target.value)
                      }
                      error={
                        touched.gtBucketName && Boolean(errors.gtBucketName)
                      }
                      helperText={errors.gtBucketName}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={12} md={6}>
                  <FormControl fullWidth>
                    <TextField
                      name="gtPath"
                      label="Path"
                      placeholder="Path"
                      helperText={errors.gtPath}
                      value={values.gtPath}
                      onChange={(e) => setFieldValue('gtPath', e.target.value)}
                      onBlur={handleBlur}
                      error={touched.gtPath && Boolean(errors.gtPath)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="This field should contain the relative path to the data, excluding protocol symbols like '://'. For example, if the full URL is 'https://bucket.com/annotations/gt_name.json', the input should only include 'annotations/gt_name.json'.">
                              <HelpOutlineIcon
                                color="secondary"
                                sx={{ cursor: 'pointer' }}
                              />
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </FormControl>
                </Grid>
              </Grid>
              <Grid item container xs={12} spacing={2}>
                <Grid item xs={12} sm={12} md={6}>
                  <FormControl fullWidth>
                    <TextField
                      name="userGuide"
                      value={values.userGuide}
                      onChange={(e) =>
                        setFieldValue('userGuide', e.target.value)
                      }
                      onBlur={handleBlur}
                      placeholder="Annotator's guideline for data labeling"
                      label="User Guide URL"
                      error={touched.userGuide && Boolean(errors.userGuide)}
                      helperText={errors.userGuide}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="This field should contain a brief description of how data should be annotated. A user guide is a valuable resource that provides instructions, guidelines, and best practices for annotators, helping them understand how to accurately and consistently annotate the data.">
                              <HelpOutlineIcon
                                color="secondary"
                                sx={{ cursor: 'pointer' }}
                              />
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={12} md={6}>
                  <FormControl fullWidth>
                    <TextField
                      name="accuracyTarget"
                      label="Accuracy target %"
                      placeholder="Accuracy target 80%"
                      type="number"
                      value={values.accuracyTarget}
                      onChange={(e) =>
                        setFieldValue('accuracyTarget', e.target.value)
                      }
                      onBlur={handleBlur}
                      error={
                        touched.accuracyTarget && Boolean(errors.accuracyTarget)
                      }
                      helperText={errors.accuracyTarget}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="Result accuracy tooltip here.">
                              <HelpOutlineIcon
                                color="secondary"
                                sx={{ cursor: 'pointer' }}
                              />
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </FormControl>
                </Grid>
              </Grid>
              <Grid item container xs={12} spacing={2}>
                <Grid item xs={12} sm={12} md={6}>
                  <FormControl fullWidth>
                    <TextField
                      name="segmentDuration"
                      label="Segment duration (ms)"
                      placeholder="Segment duration"
                      type="number"
                      value={values.segmentDuration}
                      onChange={(e) =>
                        setFieldValue('segmentDuration', e.target.value)
                      }
                      onBlur={handleBlur}
                      error={
                        touched.segmentDuration &&
                        Boolean(errors.segmentDuration)
                      }
                      helperText={errors.segmentDuration}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="Duration of one audio segment in milliseconds. This value will be used later to calculate job bounty">
                              <HelpOutlineIcon
                                color="secondary"
                                sx={{ cursor: 'pointer' }}
                              />
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
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
              goToPrevStep();
              updateJobRequest({
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
