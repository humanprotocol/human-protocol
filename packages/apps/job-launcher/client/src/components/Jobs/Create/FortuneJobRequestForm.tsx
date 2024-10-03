import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from '../../../components/Accordion';
import { CollectionsFilledIcon } from '../../../components/Icons/CollectionsFilledIcon';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import { getQualifications } from '../../../services/qualification';
import { Qualification } from '../../../types';
import { FortuneJobRequestValidationSchema } from './schema';

export const FortuneJobRequestForm = () => {
  const { jobRequest, updateJobRequest, goToPrevStep, goToNextStep } =
    useCreateJobPageUI();
  const [expanded, setExpanded] = useState<string | false>('panel1');
  const [qualificationsOptions, setQualificationsOptions] = useState<
    Qualification[]
  >([]);

  const initialValues = {
    title: '',
    fortunesRequested: undefined,
    description: '',
    qualifications: [],
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setQualificationsOptions(await getQualifications());
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
      setExpanded(newExpanded ? panel : false);
    };

  const handleNext = ({
    title,
    fortunesRequested,
    description,
    qualifications,
  }: any) => {
    updateJobRequest?.({
      ...jobRequest,
      fortuneRequest: {
        title,
        fortunesRequested,
        description,
        qualifications: (qualifications as Qualification[]).map(
          (qualification) => qualification.reference,
        ),
      },
    });
    goToNextStep?.();
  };

  return (
    <Box sx={{ mt: '42px' }}>
      <Formik
        initialValues={initialValues}
        validationSchema={FortuneJobRequestValidationSchema}
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
          <form onSubmit={handleSubmit}>
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
                <Grid container spacing={2} mb={4}>
                  <Grid item xs={12} sm={12} md={6}>
                    <FormControl fullWidth>
                      <TextField
                        name="title"
                        value={values.title}
                        onChange={(e) => setFieldValue('title', e.target.value)}
                        onBlur={handleBlur}
                        placeholder="Title"
                        label="Title"
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
                        label="Fortunes Requested"
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
                        label="Description"
                        error={
                          touched.description && Boolean(errors.description)
                        }
                        helperText={errors.description}
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
                            <Box
                              display="flex"
                              alignItems="center"
                              width="100%"
                            >
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
        )}
      </Formik>
    </Box>
  );
};
