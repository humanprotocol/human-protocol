import React, { createContext, useContext, useState } from 'react';
import { SUPPORTED_CHAIN_IDS } from '../constants/chains';
import { CreateJobStep, JobRequest, JobType, PayMethod } from '../types';

export type CreateJobPageUIType = {
  step: CreateJobStep;
  payMethod: PayMethod;
  jobRequest: JobRequest;
  reset?: () => void;
  changePayMethod?: (method: PayMethod) => void;
  updateJobRequest?: (jobRequest: JobRequest) => void;
  goToPrevStep?: () => void;
  goToNextStep?: () => void;
};

const initialData: Omit<
  CreateJobPageUIType,
  'changePayMethod' | 'goToNextStep'
> = {
  step: CreateJobStep.FundingMethod,
  payMethod: PayMethod.Crypto,
  jobRequest: {
    jobType: JobType.Fortune,
    chainId: SUPPORTED_CHAIN_IDS[0],
  },
};

export const CreateJobPageUIContext =
  createContext<CreateJobPageUIType>(initialData);

export const useCreateJobPageUI = () => useContext(CreateJobPageUIContext);

export const CreateJobPageUIProvider = ({
  children,
}: {
  children: React.ReactElement;
}) => {
  const [step, setStep] = useState<CreateJobStep>(CreateJobStep.FundingMethod);
  const [payMethod, setPayMethod] = useState<PayMethod>(PayMethod.Crypto);
  const [jobRequest, setJobRequest] = useState<JobRequest>({
    jobType: JobType.Fortune,
    chainId: SUPPORTED_CHAIN_IDS[0],
  });

  const goToPrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const goToNextStep = () => {
    setStep((prev) => prev + 1);
  };

  const changePayMethod = (method: PayMethod) => setPayMethod(method);

  const updateJobRequest = (newJobRequest: JobRequest) =>
    setJobRequest(newJobRequest);

  const reset = () => {
    setStep(CreateJobStep.FundingMethod);
    setPayMethod(PayMethod.Crypto);
    setJobRequest({
      jobType: JobType.Fortune,
      chainId: SUPPORTED_CHAIN_IDS[0],
    });
  };

  const value = {
    step,
    payMethod,
    jobRequest,
    goToPrevStep,
    goToNextStep,
    changePayMethod,
    updateJobRequest,
    reset,
  };

  return (
    <CreateJobPageUIContext.Provider value={value}>
      {children}
    </CreateJobPageUIContext.Provider>
  );
};
