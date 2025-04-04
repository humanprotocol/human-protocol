import { Box } from '@mui/material';
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import { CreateJobStep, JobType, PayMethod } from '../../../types';
import { CreateJob } from './CreateJob';
import { FundingMethod } from './FundingMethod';
import { LaunchSuccess } from './LaunchSuccess';
import { PayJob } from './PayJob';

const supportedJobTypes = Object.values(JobType);

function isSupportedJobType(jobType: string): jobType is JobType {
  return supportedJobTypes.includes(jobType as JobType);
}

export const CreateJobView = () => {
  const { step, changePayMethod, setStep, updateJobRequest } =
    useCreateJobPageUI();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const jobType = searchParams.get('jobType') || '';

    if (isSupportedJobType(jobType)) {
      changePayMethod(PayMethod.Fiat);
      setStep(CreateJobStep.CreateJob);

      updateJobRequest({ jobType });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box mt={3}>
      {step === CreateJobStep.FundingMethod && <FundingMethod />}
      {step === CreateJobStep.CreateJob && <CreateJob />}
      {step === CreateJobStep.PayJob && <PayJob />}
      {step === CreateJobStep.Launch && <LaunchSuccess />}
    </Box>
  );
};
