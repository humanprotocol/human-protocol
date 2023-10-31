import { ChainId } from '@human-protocol/sdk';
import { SUPPORTED_CHAIN_IDS } from '../constants/chains';
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
    minQuality: Number(data.accuracyTarget) / 100,
    gtUrl: data.groundTruthUrl,
    userGuide: data.userGuide,
    type: data.type,
  };
  await api.post('/job/cvat', body);
};

export const getJobList = async ({
  chainId = ChainId.ALL,
  status,
}: {
  chainId?: ChainId;
  status?: JobStatus;
}) => {
  const { data } = await api.get(`/job/list`, {
    params: {
      networks: chainId === ChainId.ALL ? SUPPORTED_CHAIN_IDS : chainId,
      status,
    },
  });
  return data;
};

export const getJobResult = async (jobId: number) => {
  const { data } = await api.get(`/job/result`, { params: { jobId } });
  return data;
};

export const getJobDetails = async (jobId: number) => {
  const { data } = await api.get<JobDetailsResponse>(`/job/details/${jobId}`);
  return data;
};
