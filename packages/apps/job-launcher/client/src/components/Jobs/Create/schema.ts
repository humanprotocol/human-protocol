import * as Yup from 'yup';

export const CvatJobRequestValidationSchema = Yup.object().shape({
  title: Yup.string().required('Title is required'),
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
    .min(0)
    .max(100),
});

export const FortuneJobRequestValidationSchema = Yup.object().shape({
  title: Yup.string().required('Title is required'),
  description: Yup.string().required('Description is required'),
  fortunesRequested: Yup.number().required('FortunesRequested is required'),
});
