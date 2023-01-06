import * as React from 'react';

import { JobCreatorFormStepOne } from './Steps/JobCreator/JobCreator';
import { FundingStep } from './Steps/FundingStep';
import { ProgressStep } from './Steps/ProgressStep';
import { ConfirmStep } from './Steps/ConfirmStep';

enum FormSteps {
  StepOne = 0,
  ProgressStep = 1,
  FundingStep = 2,
  ConfirmStep = 3,
}

export const JobCreatorForm = () => {
  const [formStep, setFormStep] = React.useState<FormSteps>(FormSteps.StepOne);

  const nextStep = () => setFormStep(formStep + 1);
  const prevStep = () => setFormStep(formStep - 1);

  let step;
  switch (formStep) {
    case FormSteps.FundingStep:
      step = <FundingStep />;
      break;
    case FormSteps.ProgressStep:
      step = <ProgressStep nextStep={nextStep} prevStep={prevStep} />;
      break;
    case FormSteps.ConfirmStep:
      step = <ConfirmStep />;
      break;
    case FormSteps.StepOne:
    default:
      step = <JobCreatorFormStepOne nextStep={nextStep} />;
      break;
  }

  return <>{step}</>;
};
