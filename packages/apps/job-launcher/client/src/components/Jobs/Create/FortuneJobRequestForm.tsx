import {
  Box,
  Button,
  FormControl,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { Formik } from 'formik';
import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '../../../components/Accordion';
import { CollectionsFilledIcon } from '../../../components/Icons/CollectionsFilledIcon';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import { FortuneJobRequestValidationSchema } from './schema';

export const FortuneJobRequestForm = () => {
  const { jobRequest, updateJobRequest, goToPrevStep, goToNextStep } =
    useCreateJobPageUI();
  const [expanded, setExpanded] = useState<string | false>('panel1');

  const initialValues = {
    title: '',
    fortunesRequested: undefined,
    description: '',
  };

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
      setExpanded(newExpanded ? panel : false);
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
