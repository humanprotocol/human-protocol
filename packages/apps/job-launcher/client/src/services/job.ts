import {
  CreateFortuneJobRequest,
  CreateAnnotationJobRequest,
  FortuneRequest,
  AnnotationRequest,
} from '../types';
import api from '../utils/api';

export const createFortuneJob = async (
  chainId: number,
  data: FortuneRequest,
  amount: number | string
) => {
  const body: CreateFortuneJobRequest = {
    chainId,
    submissionsRequired: Number(data.fortunesRequested),
    requesterTitle: data.title,
    requesterDescription: data.description,
    fundAmount: Number(amount),
  };
  await api.post('/job/fortune', body);
};

export const createAnnotationJob = async (
  chainId: number,
  data: AnnotationRequest,
  amount: number | string
) => {
  const body: CreateAnnotationJobRequest = {
    chainId,
    dataUrl: data.dataUrl,
    submissionsRequired: data.annotationsPerImage,
    labels: data.labels,
    requesterDescription: data.description,
    requesterAccuracyTarget: data.accuracyTarget,
    fundAmount: Number(amount),
  };
  await api.post('/job/cvat', body);
};
