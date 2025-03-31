import { Box } from '@mui/material';
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import { CreateJobStep, JobType, PayMethod } from '../../../types';
import { CreateJob } from './CreateJob';
import { FundingMethod } from './FundingMethod';
import { LaunchSuccess } from './LaunchSuccess';
import { PayJob } from './PayJob';

export const CreateJobView = () => {
  const { step, changePayMethod, setStep, updateJobRequest } =
    useCreateJobPageUI();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const jobType = searchParams.get('jobType');
    const supportedJobTypes = ['fortune', 'cvat', 'hcaptcha'];

    if (jobType && supportedJobTypes.includes(jobType.toLowerCase())) {
      changePayMethod(PayMethod.Fiat);
      setStep(CreateJobStep.CreateJob);

      updateJobRequest({
        jobType:
          jobType === 'fortune'
            ? JobType.Fortune
            : jobType === 'cvat'
              ? JobType.CVAT
              : JobType.HCAPTCHA,
      });
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
