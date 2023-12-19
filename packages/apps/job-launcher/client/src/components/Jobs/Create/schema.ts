import * as Yup from 'yup';

export const CvatJobRequestValidationSchema = Yup.object().shape({
  labels: Yup.array().of(Yup.string()).min(1, 'At least one label is required'),
  description: Yup.string().required('Description is required'),
  dataUrl: Yup.string().required('Data URL is required').url('Invalid URL'),
  groundTruthUrl: Yup.string()
    .required('Ground Truth URL is required')
    .url('Invalid URL'),
  userGuide: Yup.string()
    .required('User Guide URL is required')
    .url('Invalid URL'),
  accuracyTarget: Yup.number()
    .required('Accuracy target is required')
    .moreThan(0, 'Accuracy target must be greater than 0')
    .max(100, 'Accuracy target must be less than or equal to 100'),
});

export const FortuneJobRequestValidationSchema = Yup.object().shape({
  title: Yup.string().required('Title is required'),
  description: Yup.string().required('Description is required'),
  fortunesRequested: Yup.number()
    .required('FortunesRequested is required')
    .moreThan(0, 'FortunesRequested must be greater than 0'),
});

export const HCaptchaJobRequesteValidationSchema = Yup.object().shape({
  taskBidPrice: Yup.number()
    .required('Task Bid Price is required')
    .moreThan(0, 'Task Bid Price must be greater than 0'),
  minRequests: Yup.number()
    .required('Min Requests is required')
    .moreThan(0, 'Min Requests must be greater than 0'),
  maxRequests: Yup.number()
    .required('Max Requests is required')
    .moreThan(0, 'Max Requests must be greater than 0'),
  dataUrl: Yup.string().required('Data URL is required').url('Invalid URL'),
  labelingPrompt: Yup.string().required('Labeling Prompt is required'),
  groundTruths: Yup.string()
    .required('Ground Truth URL is required')
    .url('Invalid URL'),
  accuracyTarget: Yup.number()
    .required('Accuracy target is required')
    .moreThan(0, 'Accuracy target must be greater than 0')
    .max(100, 'Accuracy target must be less than or equal to 100'),
  targetBrowser: Yup.string().required('Target Browser is required'),
});
