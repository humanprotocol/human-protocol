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
import { useSearchParams } from 'react-router-dom';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '../../../components/Accordion';
import { CollectionsFilledIcon } from '../../../components/Icons/CollectionsFilledIcon';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import {
  AWSRegions,
  CvatJobType,
  GCSRegions,
  StorageProviders,
  Label,
} from '../../../types';
import { CvatJobRequestValidationSchema, dataValidationSchema } from './schema';

export const CvatJobRequestForm = () => {
  const { jobRequest, updateJobRequest, goToPrevStep, goToNextStep } =
    useCreateJobPageUI();
  const [searchParams] = useSearchParams();
  const [expanded, setExpanded] = useState<string[]>(['panel1']);

  const initialValues = {
    labels: [],
    nodes: [],
    type: CvatJobType.IMAGE_BOXES,
    description: '',
    userGuide: '',
    accuracyTarget: 80,
    dataProvider: StorageProviders.AWS,
    dataRegion: '',
    dataBucketName: '',
    dataPath: '',
    bpProvider: StorageProviders.AWS,
    bpRegion: '',
    bpBucketName: '',
    bpPath: '',
    gtProvider: StorageProviders.AWS,
    gtRegion: '',
    gtBucketName: '',
    gtPath: '',
  };

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
      if (newExpanded) {
        setExpanded([...expanded, panel]);
      } else {
        setExpanded(expanded.filter((item) => item !== panel));
      }
    };

  const handleNext = ({
    labels,
    nodes,
    type,
    description,
    dataProvider,
    dataRegion,
    dataBucketName,
    dataPath,
    bpProvider,
    bpRegion,
    bpBucketName,
    bpPath,
    gtProvider,
    gtRegion,
    gtBucketName,
    gtPath,
    userGuide,
    accuracyTarget,
  }: any) => {
    let bp = undefined;
    if (type === CvatJobType.IMAGE_BOXES_FROM_POINTS)
      bp = {
        points: {
          provider: bpProvider,
          region: bpRegion,
          bucketName: bpBucketName,
          path: bpPath,
        },
      };
    else if (type === CvatJobType.IMAGE_SKELETONS_FROM_BOXES)
      bp = {
        boxes: {
          provider: bpProvider,
          region: bpRegion,
          bucketName: bpBucketName,
          path: bpPath,
        },
      };
    const labelArray: Label[] = labels.map((name: string) => {
      if (type === CvatJobType.IMAGE_SKELETONS_FROM_BOXES)
        return { name: name, nodes: nodes };
      else return { name: name };
    });
    updateJobRequest?.({
      ...jobRequest,
      cvatRequest: {
        labels: labelArray,
        type,
        description,
        data: {
          dataset: {
            provider: dataProvider,
            region: dataRegion,
            bucketName: dataBucketName,
            path: dataPath,
          },
          ...bp,
        },
        groundTruth: {
          provider: gtProvider,
          region: gtRegion,
          bucketName: gtBucketName,
          path: gtPath,
        },
        userGuide,
        accuracyTarget,
      },
    });
    goToNextStep?.();
  };

  const [updatedValidationSchema, setUpdatedValidationSchema] = useState(
    CvatJobRequestValidationSchema,
  );

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
    validationSchema: updatedValidationSchema,
    onSubmit: handleNext,
    validateOnChange: true,
    validateOnMount: true,
  });

  useEffect(() => {
    const type = searchParams.get('type');
    if (type && Object.values(CvatJobType).includes(type as CvatJobType)) {
      setFieldValue('type', type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                      setUpdatedValidationSchema(
                        CvatJobRequestValidationSchema.concat(
                          dataValidationSchema(e.target.value as CvatJobType),
                        ),
                      );
                      setFieldValue('type', e.target.value);
                    }}
                    error={touched.type && Boolean(errors.type)}
                    onBlur={handleBlur}
                  >
                    <MenuItem value={CvatJobType.IMAGE_POINTS}>Points</MenuItem>
                    <MenuItem value={CvatJobType.IMAGE_BOXES}>
                      Bounding Boxes
                    </MenuItem>
                    <MenuItem value={CvatJobType.IMAGE_BOXES_FROM_POINTS}>
                      Bounding Boxes from points
                    </MenuItem>
                    <MenuItem value={CvatJobType.IMAGE_SKELETONS_FROM_BOXES}>
                      Skeletons from Bounding Boxes
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
              {values.type === CvatJobType.IMAGE_SKELETONS_FROM_BOXES && (
                <Grid item xs={12} sm={12}>
                  <FormControl fullWidth>
                    <Autocomplete
                      multiple
                      freeSolo
                      options={[]}
                      value={values.nodes}
                      onChange={(event, newValues) => {
                        const updatedNodes = (newValues as string[]).map(
                          (node: string) =>
                            node.startsWith('Add: ')
                              ? node.replace('Add: ', '')
                              : node,
                        );
                        setFieldValue('nodes', updatedNodes);
                      }}
                      filterOptions={(options: any, params) => {
                        const filtered = options;
                        const { inputValue } = params;
                        if (
                          inputValue !== '' &&
                          !options.includes(inputValue)
                        ) {
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
                            label="Nodes"
                            variant="outlined"
                            onBlur={handleBlur}
                            fullWidth
                          />
                        </Box>
                      )}
                    />
                    {errors.nodes && (
                      <FormHelperText sx={{ mx: '14px', mt: '3px' }} error>
                        {errors.nodes}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              )}
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
                      <MenuItem value={StorageProviders.AWS}>AWS</MenuItem>
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
                    />
                  </FormControl>
                </Grid>
              </Grid>
              {[
                CvatJobType.IMAGE_BOXES_FROM_POINTS,
                CvatJobType.IMAGE_SKELETONS_FROM_BOXES,
              ].includes(values.type) && (
                <Grid item container xs={12} spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" fontWeight={700}>
                      {values.type === CvatJobType.IMAGE_BOXES_FROM_POINTS
                        ? 'Points'
                        : 'Boxes'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={12} md={6}>
                    <FormControl variant="outlined" fullWidth>
                      <InputLabel id="cvat-bp-storage-provider-select-label">
                        Storage Provider
                      </InputLabel>
                      <Select
                        labelId="cvat-bp-storage-provider-select-label"
                        id="cvat-bp-storage-provider-select"
                        label="Storage Provider"
                        value={values.bpProvider}
                        onChange={(e) =>
                          setFieldValue('bpProvider', e.target.value)
                        }
                        error={touched.bpProvider && Boolean(errors.bpProvider)}
                        onBlur={handleBlur}
                      >
                        <MenuItem value={StorageProviders.AWS}>AWS</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={12} md={6}>
                    <FormControl variant="outlined" fullWidth>
                      <InputLabel id="cvat-bp-storage-provider-select-label">
                        Region
                      </InputLabel>
                      <Select
                        labelId="cvat-bp-storage-provider-select-label"
                        id="cvat-bp-storage-provider-select"
                        label="Region"
                        value={values.bpRegion}
                        onChange={(e) =>
                          setFieldValue('bpRegion', e.target.value)
                        }
                        error={touched.bpRegion && Boolean(errors.bpRegion)}
                        onBlur={handleBlur}
                      >
                        {Object.values(dataRegions).map((region) => (
                          <MenuItem key={`bpset-${region}`} value={region}>
                            {region}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.bpRegion && (
                        <FormHelperText sx={{ mx: '14px', mt: '3px' }} error>
                          {errors.bpRegion}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={12} md={6}>
                    <FormControl fullWidth>
                      <TextField
                        name="bpBucketName"
                        label="Bucket Name"
                        placeholder="Bucket Name"
                        value={values.bpBucketName}
                        onBlur={handleBlur}
                        onChange={(e) =>
                          setFieldValue('bpBucketName', e.target.value)
                        }
                        error={
                          touched.bpBucketName && Boolean(errors.bpBucketName)
                        }
                        helperText={errors.bpBucketName}
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={12} md={6}>
                    <FormControl fullWidth>
                      <TextField
                        name="bpPath"
                        label="Path"
                        placeholder="Path"
                        value={values.bpPath}
                        onBlur={handleBlur}
                        onChange={(e) =>
                          setFieldValue('bpPath', e.target.value)
                        }
                        error={touched.bpPath && Boolean(errors.bpPath)}
                        helperText={errors.bpPath}
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              )}
              <Grid item container xs={12} spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" fontWeight={700}>
                    Ground truth
                  </Typography>
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
                      <MenuItem value={StorageProviders.AWS}>AWS</MenuItem>
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
                            <Tooltip title="This field should contain a URL or link to the ground truth data. Ground truth data serves as the reference or gold standard for your annotations. It represents the correct or desired data, against which the annotations are compared for accuracy and quality assessment.">
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
