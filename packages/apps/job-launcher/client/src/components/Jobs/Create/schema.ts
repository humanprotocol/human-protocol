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
