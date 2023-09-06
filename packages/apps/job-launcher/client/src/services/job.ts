import {
  CreateFortuneJobRequest,
  CreateCvatJobRequest,
  FortuneRequest,
  CvatRequest,
  JobStatus,
  JobDetailsResponse,
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

export const createCvatJob = async (
  chainId: number,
  data: CvatRequest,
  amount: number | string
) => {
  const body: CreateCvatJobRequest = {
    chainId,
    requesterDescription: data.description,
    fundAmount: Number(amount),
    dataUrl: data.dataUrl,
    labels: data.labels,
    minQuality: Number(data.accuracyTarget),
    gtUrl: data.groundTruthUrl,
    type: data.type,
  };
  await api.post('/job/cvat', body);
};

export const getJobListByStatus = async (status: JobStatus) => {
  const { data } = await api.get(`/job/list`, { params: { status } });
  return data;
};

export const getJobResult = async (jobId: number) => {
  const { data } = await api.get(`/job/result`, { params: { jobId } });
  return data;
};

export const getJobDetails = async (jobId: number) => {
  const { data } = await api.get<JobDetailsResponse>(`/details/${jobId}`);
  return data;
};
