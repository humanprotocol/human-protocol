import { ChainId } from '@human-protocol/sdk';
import { SUPPORTED_CHAIN_IDS } from '../constants/chains';
import {
  CreateFortuneJobRequest,
  CreateCvatJobRequest,
  FortuneRequest,
  CvatRequest,
  JobStatus,
  JobDetailsResponse,
  HCaptchaRequest,
  FortuneFinalResult,
} from '../types';
import api from '../utils/api';

export const createFortuneJob = async (
  chainId: number,
  data: FortuneRequest,
  amount: number | string,
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
  amount: number | string,
) => {
  const body: CreateCvatJobRequest = {
    chainId,
    requesterDescription: data.description,
    fundAmount: Number(amount),
    data: data.data,
    labels: data.labels,
    minQuality: Number(data.accuracyTarget) / 100,
    groundTruth: data.groundTruth,
    userGuide: data.userGuide,
    type: data.type,
  };
  await api.post('/job/cvat', body);
};

export const createHCaptchaJob = async (
  chainId: number,
  data: HCaptchaRequest,
  amount: number | string,
) => {
  await api.post('/job/hCaptcha', {
    chainId,
    ...data,
  });
};

export const getJobList = async ({
  chainId = ChainId.ALL,
  status,
}: {
  chainId?: ChainId;
  status?: JobStatus;
}) => {
  const networks = chainId === ChainId.ALL ? SUPPORTED_CHAIN_IDS : [chainId];
  let queryString = networks.map((n) => `networks=${n}`).join('&');

  if (status !== undefined) {
    queryString += `&status=${status}`;
  }
  const { data } = await api.get(`/job/list?${queryString}`);
  return data;
};

export const getJobResult = async (jobId: number) => {
  const { data } = await api.get<FortuneFinalResult[] | string>(
    `/job/result/${jobId}`,
    {},
  );
  return data;
};

export const getJobDetails = async (jobId: number) => {
  const { data } = await api.get<JobDetailsResponse>(`/job/details/${jobId}`);
  return data;
};

export const cancelJob = async (jobId: number) => {
  const { data } = await api.patch<JobDetailsResponse>(`/job/cancel/${jobId}`);
  return data;
};
