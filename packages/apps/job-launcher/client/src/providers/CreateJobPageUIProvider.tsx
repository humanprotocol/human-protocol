import { ChainId } from '@human-protocol/sdk';
import React, { createContext, useContext, useState } from 'react';
import { CreateJobStep, JobRequest, JobType, PayMethod } from '../types';

export type CreateJobPageUIType = {
  step: CreateJobStep;
  payMethod: PayMethod;
  jobRequest: JobRequest;
  changePayMethod?: (method: PayMethod) => void;
  changeJobType?: (jobType: JobType) => void;
  changeNetwork?: (chainId: ChainId) => void;
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
    chainId: ChainId.MAINNET,
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
    chainId: ChainId.MAINNET,
  });

  const goToNextStep = () => {
    setStep((prev) => prev + 1);
  };

  const changePayMethod = (method: PayMethod) => setPayMethod(method);

  const changeJobType = (jobType: JobType) =>
    setJobRequest((prev) => ({ ...prev, jobType }));

  const changeNetwork = (chainId: ChainId) =>
    setJobRequest((prev) => ({ ...prev, chainId }));

  const value = {
    step,
    payMethod,
    jobRequest,
    goToNextStep,
    changePayMethod,
    changeJobType,
    changeNetwork,
  };

  return (
    <CreateJobPageUIContext.Provider value={value}>
      {children}
    </CreateJobPageUIContext.Provider>
  );
};
