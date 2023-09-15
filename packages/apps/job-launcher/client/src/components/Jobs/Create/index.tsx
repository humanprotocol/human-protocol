import { Box } from '@mui/material';
import React from 'react';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import { CreateJobStep } from '../../../types';
import { CreateJob } from './CreateJob';
import { FundingMethod } from './FundingMethod';
import { LaunchSuccess } from './LaunchSuccess';
import { PayJob } from './PayJob';

export const CreateJobView = () => {
  const { step } = useCreateJobPageUI();

  return (
    <Box mt={3}>
      {step === CreateJobStep.FundingMethod && <FundingMethod />}
      {step === CreateJobStep.CreateJob && <CreateJob />}
      {step === CreateJobStep.PayJob && <PayJob />}
      {step === CreateJobStep.Launch && <LaunchSuccess />}
    </Box>
  );
};
