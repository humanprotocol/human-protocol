import * as Yup from 'yup';

export const CvatJobRequestValidationSchema = Yup.object().shape({
  labels: Yup.array().of(Yup.string()).min(1, 'At least one label is required'),
  description: Yup.string().required('Description is required'),
  dataProvider: Yup.string().required('Data provider is required'),
  dataRegion: Yup.string().required('Data region is required'),
  dataBucketName: Yup.string().required('Data bucket name is required'),
  dataPath: Yup.string().optional(),
  gtProvider: Yup.string().required('Ground truth provider is required'),
  gtRegion: Yup.string().required('Ground truth region is required'),
  gtBucketName: Yup.string().required('Ground truth bucket name is required'),
  gtPath: Yup.string().optional(),
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
    .moreThan(
      Yup.ref('minRequests'),
      'Max Requests must be greater than min requests',
    ),
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
  images: Yup.array().of(Yup.string().url('Invalid Image URL')),
});
