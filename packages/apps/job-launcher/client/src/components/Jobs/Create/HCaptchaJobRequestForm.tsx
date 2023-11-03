import AddIcon from '@mui/icons-material/Add';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  Alert,
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import MuiAccordionSummary, {
  AccordionSummaryProps,
} from '@mui/material/AccordionSummary';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { Formik } from 'formik';
import { useState } from 'react';
import { CollectionsFilledIcon } from '../../../components/Icons/CollectionsFilledIcon';
import { HCaptchaJobType } from '../../../types';

const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  marginBottom: '42px',
  '&:not(:last-child)': {
    borderBottom: 0,
  },
  '&:before': {
    display: 'none',
  },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary
    expandIcon={<ArrowDropDownIcon sx={{ fontSize: '2rem' }} color="primary" />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor: `rgba(20, 6, 178, 0.08)`,
  borderRadius: '12px',
  padding: '8px 32px',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(180deg)',
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: '42px 0px 22px',
}));

export const HCaptchaJobRequestForm = () => {
  const [expanded, setExpanded] = useState<string | false>('panel1');

  const initialValues = {
    labels: [],
    description: '',
    dataUrl: '',
    groundTruthUrl: '',
    userGuide: '',
    accuracyTarget: 80,
  };

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
      setExpanded(newExpanded ? panel : false);
    };

  const handleNext = () => {
    console.log('next');
  };

  return (
    <Box mt="42px">
      <Formik initialValues={initialValues} onSubmit={handleNext}>
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
            <Accordion
              expanded={expanded === 'panel1'}
              onChange={handleChange('panel1')}
            >
              <AccordionSummary
                aria-controls="panel1d-content"
                id="panel1d-header"
              >
                <CollectionsFilledIcon />
                <Typography variant="body2" fontWeight={700} ml={2}>
                  General
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item container spacing={2} xs={12} sm={12} md={6}>
                    <Grid item xs={12} sm={12} md={6}>
                      <FormControl variant="standard" fullWidth>
                        <InputLabel id="job-type-select-label">
                          Select job type
                        </InputLabel>
                        <Select
                          labelId="job-type-select-label"
                          id="job-type-select"
                          label={'Select job type'}
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
                          defaultValue={HCaptchaJobType.COMPARISON}
                        >
                          <MenuItem value={HCaptchaJobType.COMPARISON}>
                            Comparison
                          </MenuItem>
                          <MenuItem value={HCaptchaJobType.CATEGORIZATION}>
                            Categorization
                          </MenuItem>
                          <MenuItem value={HCaptchaJobType.POLYGON}>
                            Polygon
                          </MenuItem>
                          <MenuItem value={HCaptchaJobType.LANDMARK}>
                            Landmark
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
                          name="bidPrice"
                          label="Task bid price"
                          placeholder="Task bid price HMT"
                        />
                      </FormControl>
                    </Grid>
                  </Grid>
                  <Grid item xs={12} sm={12} md={6}>
                    <Alert
                      severity="info"
                      sx={{ background: 'rgba(2, 136, 209, 0.04)' }}
                    >
                      Unsure what job type to choose?
                    </Alert>
                  </Grid>
                  <Grid item xs={12} sm={12} md={6}>
                    <FormControl fullWidth>
                      <TextField
                        name="minRequestsNumber"
                        label="Requests number minimum"
                        placeholder="Add the number of requests to complete the job"
                        helperText="Minimum number of times the image is sent for annotation."
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={12} md={6}>
                    <FormControl fullWidth>
                      <TextField
                        name="maxRequestsNumber"
                        label="Requests number maximum"
                        placeholder="Add the number of requests to complete the job"
                        helperText="Maximum number of times the image is sent for annotation."
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
            <Accordion
              expanded={expanded === 'panel2'}
              onChange={handleChange('panel2')}
            >
              <AccordionSummary
                aria-controls="panel2d-content"
                id="panel2d-header"
              >
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
                        name="datasetUrl"
                        label="Upload dataset"
                        placeholder="Add URL to your dataset: Amazon S3, Google Cloud Platform, etc."
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <TextField
                        name="labelTarget"
                        label="Label target"
                        placeholder="Name one item to annotate: Chair / Dog, etc."
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <TextField
                        name="question"
                        label="Question for workers"
                        placeholder="Instructions for labeling the item"
                        helperText="60 characters is optimal"
                      />
                    </FormControl>
                  </Grid>
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
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                        }}
                      >
                        <Box></Box>
                        <Box></Box>
                        <Box></Box>
                      </Box>
                      <Box>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<AddIcon />}
                        >
                          Add Image
                        </Button>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <TextField
                        name="groundTruthUrl"
                        label="Ground truth"
                        placeholder="Add URL to ground truth: Amazon S3, Google Cloud Platform, etc."
                        helperText="Provide ground truth to set the right ones images."
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={12} md={6}>
                    <FormControl fullWidth>
                      <TextField
                        name="accuracy"
                        label="Result accuracy"
                        placeholder="Accuracy target 80%"
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={12} md={6}>
                    <FormControl fullWidth>
                      <TextField
                        name="minWorkerConfidence"
                        label="Minimum worker confidence"
                        placeholder="0.85"
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
            <Accordion
              expanded={expanded === 'panel3'}
              onChange={handleChange('panel3')}
            >
              <AccordionSummary
                aria-controls="panel3d-content"
                id="panel3d-header"
              >
                <CollectionsFilledIcon />
                <Typography variant="body2" fontWeight={700} ml={2}>
                  Advanced (optional)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={12} md={6}>
                    <FormControl fullWidth>
                      <TextField
                        name="jobCompletionDate"
                        label="Job completion date"
                        placeholder="MM/DD/YYYY"
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={12} md={6}>
                    <FormControl fullWidth>
                      <TextField
                        name="workerLanguage"
                        label="Worker language"
                        placeholder="Text translation displayed"
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={12} md={6}>
                    <FormControl fullWidth>
                      <TextField
                        name="targetBrowser"
                        label="Target browser"
                        placeholder="All browsers"
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={12} md={6}>
                    <FormControl fullWidth>
                      <TextField
                        name="workerLocation"
                        label="Worker location"
                        placeholder="Jobs served to specific region"
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </form>
        )}
      </Formik>
    </Box>
  );
};
