import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CloudIcon from '@mui/icons-material/Cloud';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoIcon from '@mui/icons-material/Info';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from '@mui/material';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '../../../components/Accordion';
import { CollectionsFilledIcon } from '../../../components/Icons/CollectionsFilledIcon';
import languages from '../../../data/languages.json';
import locations from '../../../data/locations.json';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import { HCaptchaJobType } from '../../../types';
import { HCaptchaJobRequesteValidationSchema } from './schema';

export const HCaptchaJobRequestForm = () => {
  const { jobRequest, updateJobRequest, goToPrevStep, goToNextStep } =
    useCreateJobPageUI();
  const [expanded, setExpanded] = useState<string[]>(['panel1']);
  const [searchParams] = useSearchParams();

  const initialValues = {
    dataUrl: '',
    accuracyTarget: 85,
    completionDate: null,
    minRequests: null,
    maxRequests: null,
    // Advanced
    workerLanguage: null,
    workerLocation: null,
    targetBrowser: 'desktop',
    // Annotation
    type: HCaptchaJobType.COMPARISON,
    taskBidPrice: null,
    label: '',
    labelingPrompt: null,
    groundTruths: null,
    minWorkerConfidence: 85,
    images: [],
  };

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
      if (newExpanded) {
        setExpanded([...expanded, panel]);
      } else {
        setExpanded(expanded.filter((item) => item !== panel));
      }
    };

  const handleNext = (data: any) => {
    const hCaptchaRequest: any = {
      dataUrl: data.dataUrl,
      accuracyTarget: Number(data.accuracyTarget) / 100,
      minRequests: Number(data.minRequests),
      maxRequests: Number(data.maxRequests),
      advanced: {
        workerLanguage: data.workerLanguage,
        workerLocation: data.workerLocation,
        targetBrowser: data.targetBrowser,
      },
      annotations: {
        typeOfJob: data.type,
        taskBidPrice: Number(data.taskBidPrice),
        label: data.label ?? '',
        labelingPrompt: data.labelingPrompt,
        groundTruths: data.groundTruths,
        exampleImages: data.images,
      },
    };
    if (data.completionDate) {
      hCaptchaRequest['completionDate'] = data.completionDate;
    }
    updateJobRequest?.({
      ...jobRequest,
      hCaptchaRequest,
    });
    goToNextStep?.();
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
    validationSchema: HCaptchaJobRequesteValidationSchema,
    onSubmit: handleNext,
  });

  useEffect(() => {
    const type = searchParams.get('type');
    if (
      type &&
      Object.values(HCaptchaJobType).includes(type as HCaptchaJobType)
    ) {
      setFieldValue('type', type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box mt="42px">
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
              <Grid item container spacing={2} xs={12} sm={12} md={6}>
                <Grid item xs={12} sm={12} md={6}>
                  <FormControl variant="outlined" fullWidth>
                    <InputLabel id="job-type-select-label">
                      Select job type
                    </InputLabel>
                    <Select
                      labelId="job-type-select-label"
                      id="job-type-select"
                      label={'Select job type'}
                      value={values.type}
                      onChange={(e) => setFieldValue('type', e.target.value)}
                      error={touched.type && Boolean(errors.type)}
                      onBlur={handleBlur}
                    >
                      <MenuItem value={HCaptchaJobType.COMPARISON}>
                        Comparison
                      </MenuItem>
                      <MenuItem value={HCaptchaJobType.CATEGORIZATION}>
                        Categorization
                      </MenuItem>
                      <MenuItem value={HCaptchaJobType.POINT}>
                        Landmark
                      </MenuItem>
                      <MenuItem value={HCaptchaJobType.POLYGON}>
                        Polygon
                      </MenuItem>
                      <MenuItem value={HCaptchaJobType.BOUNDING_BOX}>
                        Bounding Box
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={12} md={6}>
                  <FormControl fullWidth>
                    <TextField
                      name="taskBidPrice"
                      label="Task bid price HMT"
                      placeholder="Task bid price HMT"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="Task bid price tooltip here.">
                              <HelpOutlineIcon
                                color="secondary"
                                sx={{ cursor: 'pointer' }}
                              />
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                      value={values.taskBidPrice}
                      onChange={(e) =>
                        setFieldValue('taskBidPrice', e.target.value)
                      }
                      onBlur={handleBlur}
                      error={
                        touched.taskBidPrice && Boolean(errors.taskBidPrice)
                      }
                      helperText={errors.taskBidPrice}
                      type="number"
                    />
                  </FormControl>
                </Grid>
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'rgba(2, 136, 209, 0.04)',
                      borderRadius: '4px',
                      padding: '6px 16px',
                    }}
                  >
                    <InfoIcon color="secondary" />
                    <Typography
                      variant="body2"
                      color="#0288D1"
                      sx={{ ml: '12px' }}
                    >
                      Unsure what job type to choose?
                    </Typography>
                    <Button
                      href="https://escrow-dashboard-git-feat-escrow-dashboard-ba2730-humanprotocol.vercel.app/launchpad/explore-jobs"
                      target="_blank"
                      sx={{ ml: 2 }}
                    >
                      Explore jobs
                    </Button>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    name="minRequests"
                    label="Requests number minimum"
                    placeholder="Add the number of requests to complete the job"
                    helperText={
                      errors.minRequests ??
                      'Minimum number of times the image is sent for annotation.'
                    }
                    value={values.minRequests}
                    onChange={(e) =>
                      setFieldValue('minRequests', e.target.value)
                    }
                    onBlur={handleBlur}
                    error={touched.minRequests && Boolean(errors.minRequests)}
                    type="number"
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    name="maxRequests"
                    label="Requests number maximum"
                    placeholder="Add the number of requests to complete the job"
                    helperText={
                      errors.maxRequests ??
                      'Maximum number of times the image is sent for annotation.'
                    }
                    value={values.maxRequests}
                    onChange={(e) =>
                      setFieldValue('maxRequests', e.target.value)
                    }
                    onBlur={handleBlur}
                    error={touched.maxRequests && Boolean(errors.maxRequests)}
                    type="number"
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
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <TextField
                    name="dataUrl"
                    label="Upload dataset"
                    placeholder="Add URL to your dataset: Amazon S3, Google Cloud Platform, etc."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CloudIcon color="secondary" />
                        </InputAdornment>
                      ),
                    }}
                    value={values.dataUrl}
                    onChange={(e) => setFieldValue('dataUrl', e.target.value)}
                    onBlur={handleBlur}
                    error={touched.dataUrl && Boolean(errors.dataUrl)}
                    helperText={errors.dataUrl}
                  />
                </FormControl>
              </Grid>
              {(values.type === HCaptchaJobType.POLYGON ||
                values.type === HCaptchaJobType.BOUNDING_BOX) && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <TextField
                      name="label"
                      label="Label target"
                      placeholder="Name one item to annotate: Chair / Dog, etc."
                      value={values.label}
                      onChange={(e) => setFieldValue('label', e.target.value)}
                      onBlur={handleBlur}
                      error={touched.label && Boolean(errors.label)}
                    />
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <TextField
                    name="labelingPrompt"
                    label="Question for workers"
                    placeholder="Instructions for labeling the item"
                    helperText={
                      errors.labelingPrompt ?? '60 characters is optimal'
                    }
                    value={values.labelingPrompt}
                    onChange={(e) =>
                      setFieldValue('labelingPrompt', e.target.value)
                    }
                    onBlur={handleBlur}
                    error={
                      touched.labelingPrompt && Boolean(errors.labelingPrompt)
                    }
                  />
                </FormControl>
              </Grid>
              {values.type !== HCaptchaJobType.CATEGORIZATION && (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      width: '50%',
                      py: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <Box>
                      <Typography>Add Image</Typography>
                      <Typography variant="body2">
                        Add up to 3 images to be shown by the capcha
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                      {values.images.map((image, index) => (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: '32px',
                              height: '32px',
                              background: 'rgba(203, 207, 232, 0.28)',
                              borderRadius: '100%',
                              mr: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {index + 1}
                          </Box>
                          <TextField
                            fullWidth
                            name="images"
                            placeholder="Place link to an example image"
                            helperText={errors.images?.[index]}
                            sx={{ flex: 1 }}
                            value={image}
                            onChange={(e) => {
                              const newImages: string[] = [...values.images];
                              newImages[index] = e.target.value;
                              setFieldValue('images', newImages);
                            }}
                            onBlur={handleBlur}
                            error={Boolean(errors.images?.[index])}
                          />
                          <IconButton
                            onClick={() => {
                              const newImages: string[] = [...values.images];
                              newImages.splice(index, 1);
                              setFieldValue('images', newImages);
                            }}
                          >
                            <CloseIcon color="primary" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                    <Box>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          if (values.images.length < 3) {
                            setFieldValue('images', [...values.images, '']);
                          }
                        }}
                      >
                        Add Image
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              )}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <TextField
                    name="groundTruths"
                    label="Ground truth"
                    placeholder="Add URL to ground truth: Amazon S3, Google Cloud Platform, etc."
                    helperText={
                      errors.groundTruths ??
                      'Provide ground truth to set the right ones images.'
                    }
                    value={values.groundTruths}
                    onChange={(e) =>
                      setFieldValue('groundTruths', e.target.value)
                    }
                    onBlur={handleBlur}
                    error={touched.groundTruths && Boolean(errors.groundTruths)}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    name="accuracyTarget"
                    label="Result accuracy %"
                    placeholder="Accuracy target 80%"
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
                    value={values.accuracyTarget}
                    onChange={(e) =>
                      setFieldValue('accuracyTarget', e.target.value)
                    }
                    onBlur={handleBlur}
                    error={
                      touched.accuracyTarget && Boolean(errors.accuracyTarget)
                    }
                    helperText={errors.accuracyTarget}
                    type="number"
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    name="minWorkerConfidence"
                    label="Minimum worker confidence %"
                    placeholder="0.85"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Minimum worker confidence  tooltip here.">
                            <HelpOutlineIcon
                              color="secondary"
                              sx={{ cursor: 'pointer' }}
                            />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                    value={values.minWorkerConfidence}
                    onChange={(e) =>
                      setFieldValue('minWorkerConfidence', e.target.value)
                    }
                    onBlur={handleBlur}
                    error={
                      touched.minWorkerConfidence &&
                      Boolean(errors.minWorkerConfidence)
                    }
                    type="number"
                  />
                </FormControl>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded.includes('panel3')}
          onChange={handleChange('panel3')}
        >
          <AccordionSummary aria-controls="panel3d-content" id="panel3d-header">
            <CollectionsFilledIcon />
            <Typography variant="body2" fontWeight={700} ml={2}>
              Advanced (optional)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12} md={6}>
                <FormControl fullWidth>
                  <DatePicker
                    label="Job completion date"
                    value={values.completionDate}
                    onChange={(newValue) =>
                      setFieldValue('completionDate', newValue)
                    }
                    slotProps={{ openPickerIcon: { sx: { color: '#858EC6' } } }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="worker-language-select-label">
                    Worker language
                  </InputLabel>
                  <Select
                    labelId="worker-language-select-label"
                    id="worker-language-select"
                    label="Worker language"
                    value={values.workerLanguage}
                    onChange={(e) =>
                      setFieldValue('workerLanguage', e.target.value)
                    }
                    error={
                      touched.workerLanguage && Boolean(errors.workerLanguage)
                    }
                    onBlur={handleBlur}
                  >
                    {languages.map((lang) => (
                      <MenuItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.workerLanguage && (
                    <FormHelperText sx={{ mx: '14px', mt: '3px' }} error>
                      {errors.workerLanguage}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="target-browser-select-label">
                    Target browser
                  </InputLabel>
                  <Select
                    labelId="target-browser-select-label"
                    id="target-browser-select"
                    label="Target browser"
                    value={values.targetBrowser}
                    onChange={(e) =>
                      setFieldValue('targetBrowser', e.target.value)
                    }
                    error={
                      touched.targetBrowser && Boolean(errors.targetBrowser)
                    }
                    onBlur={handleBlur}
                  >
                    <MenuItem value={'modern_browser'}>Modern Browser</MenuItem>
                    <MenuItem value={'desktop'}>Desktop</MenuItem>
                    <MenuItem value={'mobile'}>Mobile</MenuItem>
                  </Select>
                  {errors.targetBrowser && (
                    <FormHelperText sx={{ mx: '14px', mt: '3px' }} error>
                      {errors.targetBrowser}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="worker-location-select-label">
                    Worker location
                  </InputLabel>
                  <Select
                    labelId="worker-location-select-label"
                    id="worker-location-select"
                    label="Worker location"
                    value={values.workerLocation}
                    onChange={(e) =>
                      setFieldValue('workerLocation', e.target.value)
                    }
                    error={
                      touched.workerLocation && Boolean(errors.workerLocation)
                    }
                    onBlur={handleBlur}
                  >
                    {locations.map((loc) => (
                      <MenuItem key={loc.value} value={loc.value}>
                        {loc.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.workerLocation && (
                    <FormHelperText sx={{ mx: '14px', mt: '3px' }} error>
                      {errors.workerLocation}
                    </FormHelperText>
                  )}
                </FormControl>
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
