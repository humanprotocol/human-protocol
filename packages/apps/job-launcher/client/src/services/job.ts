import { ChainId } from '@human-protocol/sdk';
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
import { getFilenameFromContentDisposition } from '../utils/string';

export const createFortuneJob = async (
  chainId: number,
  data: FortuneRequest,
  paymentCurrency: string,
  paymentAmount: number | string,
  escrowFundToken: string,
) => {
  const body: CreateFortuneJobRequest = {
    chainId,
    submissionsRequired: Number(data.fortunesRequested),
    requesterTitle: data.title,
    requesterDescription: data.description,
    paymentCurrency,
    paymentAmount: Number(paymentAmount),
    escrowFundToken,
    qualifications: data.qualifications,
  };
  await api.post('/job/fortune', body);
};

export const createCvatJob = async (
  chainId: number,
  data: CvatRequest,
  paymentCurrency: string,
  paymentAmount: number | string,
  escrowFundToken: string,
) => {
  const body: CreateCvatJobRequest = {
    chainId,
    requesterDescription: data.description,
    paymentCurrency,
    paymentAmount: Number(paymentAmount),
    escrowFundToken,
    data: data.data,
    labels: data.labels,
    minQuality: Number(data.accuracyTarget) / 100,
    groundTruth: data.groundTruth,
    userGuide: data.userGuide,
    type: data.type,
    qualifications: data.qualifications,
  };
  await api.post('/job/cvat', body);
};

export const createHCaptchaJob = async (
  chainId: number,
  data: HCaptchaRequest,
) => {
  await api.post('/job/hCaptcha', {
    chainId,
    ...data,
  });
};

export const getJobList = async ({
  chainId = ChainId.ALL,
  status,
  page,
  pageSize,
}: {
  chainId?: ChainId;
  status?: JobStatus;
  page?: number;
  pageSize?: number;
}) => {
  const networks = chainId === ChainId.ALL ? [] : [chainId];
  let queryString = networks.map((n) => `chain_id=${n}`).join('&');

  if (status !== undefined) {
    queryString += `&status=${status}`;
  }
  queryString += `&page=${page}&page_size=${pageSize}`;
  const { data } = await api.get(
    `/job/list?${queryString}&sort=DESC&sort_field=created_at`,
  );
  return data;
};

export const getJobResult = async (jobId: number) => {
  const { data } = await api.get<FortuneFinalResult[] | string>(
    `/job/result/${jobId}`,
    {},
  );
  return data;
};

export const downloadJobResult = async (jobId: number) => {
  const { data, headers } = await api.get(`/job/result/${jobId}/download`, {
    responseType: 'blob',
  });

  const contentDisposition = headers['content-disposition'] || '';
  return {
    data,
    filename: getFilenameFromContentDisposition(contentDisposition),
  };
};

export const getJobDetails = async (jobId: number) => {
  const { data } = await api.get<JobDetailsResponse>(`/job/details/${jobId}`);
  return data;
};

export const cancelJob = async (jobId: number) => {
  const { data } = await api.patch<JobDetailsResponse>(`/job/cancel/${jobId}`);
  return data;
};
