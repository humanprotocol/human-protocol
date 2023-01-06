/* eslint-disable new-cap */
import { object, string, array, TypeOf } from 'zod';
import { parseBigDecimal } from './utils';

// const Labels = string();
export const jobCreationSchema = object({
  price: string()
    .nonempty('Expected value')
    .transform((x) => parseBigDecimal(x)),
  labels: array(string()).refine((val) => val.length % 2 === 0, {
    message: 'Must be an even number of labels',
  }),
  dataUrl: string().url().min(5, 'Url must be more than 3 characters'),
  annotationsPerImage: string()
    .nonempty('Must be a number value')
    .transform((x) => parseBigDecimal(x)),
  requesterDescription: string()
    .nonempty('Expected value')
    .min(3, 'Requester Description must be more than 3 characters')
    .max(80, 'Requester Description must be less than 80characters'),
  requesterAccuracyTarget: string()
    .nonempty('Expected value')
    .transform((x) => parseBigDecimal(x)),
  // networkId: string().positive(),
  // requestType: string()
  //   .nonempty('IMAGE_LABEL_BINARY')
  //   .min(3, 'Request Type must be more than 3 characters')
  //   .max(80, 'Request Type must be less than 80characters'),
  // datasetLength: string()
  //   .nonempty('Must be a number value')
  //   .transform((x) => parseInt(x, 10)),
  // transactionHash: string()
  //   .nonempty('Expected value')
  //   .min(3, 'Requester Description must be more than 3 characters')
  //   .max(80, 'Requester Description must be less than 80characters'),
  // requesterQuestion: string()
  //   .nonempty('Expected value')
  //   .min(3, 'Requester Question must be more than 3 characters')
  //   .max(80, 'Requester Question must be less than 80characters'),
  // requesterQuestionExample: string()
  //   .nonempty('Expected value')
  //   .min(3, 'Requester Question Example must be more than 3 characters')
  //   .max(80, 'Requester Question Example must be less than 80characters'),
});

export type IJobCreatorFormSchema = TypeOf<typeof jobCreationSchema>;

export const defaultValues: IJobCreatorFormSchema = {
  price: 0,
  labels: [],
  dataUrl: '',
  annotationsPerImage: 0,
  requesterDescription: '',
  requesterAccuracyTarget: 0,
  // networkId: 0,
  // requestType: '',
  // datasetLength: 0,
  // transactionHash: '',
  // requesterQuestion: '',
  // requesterQuestionExample: '',
};
