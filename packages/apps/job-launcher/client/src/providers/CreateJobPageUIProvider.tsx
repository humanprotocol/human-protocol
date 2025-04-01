import { ChainId } from '@human-protocol/sdk';
import React, { createContext, useContext, useState } from 'react';
import { useAccount } from 'wagmi';
import { IS_MAINNET, SUPPORTED_CHAIN_IDS } from '../constants/chains';
import { CreateJobStep, JobRequest, JobType, PayMethod } from '../types';

export type CreateJobPageUIType = {
  step: CreateJobStep;
  payMethod: PayMethod;
  jobRequest: JobRequest;
  reset: () => void;
  changePayMethod: (method: PayMethod) => void;
  updateJobRequest: (jobRequest: JobRequest) => void;
  goToPrevStep: () => void;
  goToNextStep: () => void;
  setStep: (step: CreateJobStep) => void;
};

const initialData: CreateJobPageUIType = {
  step: CreateJobStep.FundingMethod,
  payMethod: PayMethod.Crypto,
  jobRequest: {
    jobType: JobType.FORTUNE,
    chainId: undefined,
  },
  reset: () => {},
  changePayMethod: (_) => {},
  updateJobRequest: (_) => {},
  goToPrevStep: () => {},
  goToNextStep: () => {},
  setStep: (_) => {},
};

export const CreateJobPageUIContext =
  createContext<CreateJobPageUIType>(initialData);

export const useCreateJobPageUI = () => useContext(CreateJobPageUIContext);

export const CreateJobPageUIProvider = ({
  children,
}: {
  children: React.ReactElement;
}) => {
  const { chain } = useAccount();
  const [step, setStep] = useState<CreateJobStep>(CreateJobStep.FundingMethod);
  const [payMethod, setPayMethod] = useState<PayMethod>(PayMethod.Crypto);
  const [jobRequest, setJobRequest] = useState<JobRequest>({
    jobType: IS_MAINNET ? JobType.CVAT : JobType.FORTUNE,
    chainId:
      chain?.id && SUPPORTED_CHAIN_IDS.includes(chain?.id)
        ? chain?.id
        : !IS_MAINNET
          ? !chain?.id
            ? ChainId.POLYGON_AMOY
            : undefined
          : undefined,
  });

  const goToPrevStep = () => {
    if (step > CreateJobStep.FundingMethod) {
      setStep((prev) => prev - 1);
    }
  };

  const goToNextStep = () => {
    if (step < CreateJobStep.Launch) {
      setStep((prev) => prev + 1);
    }
  };

  const changePayMethod = (method: PayMethod) => setPayMethod(method);

  const updateJobRequest = (newJobRequest: JobRequest) =>
    setJobRequest(newJobRequest);

  const reset = () => {
    setStep(CreateJobStep.FundingMethod);
    setPayMethod(PayMethod.Crypto);
    setJobRequest({
      jobType: JobType.FORTUNE,
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
    setStep,
  };

  return (
    <CreateJobPageUIContext.Provider value={value}>
      {children}
    </CreateJobPageUIContext.Provider>
  );
};
