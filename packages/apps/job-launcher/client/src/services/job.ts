import { ChainId } from '@human-protocol/sdk';
import { CVAT_JOB_SIZE, CVAT_VAL_SIZE } from '../constants/cvat';
import {
  CreateJobRequest,
  FortuneRequest,
  CvatRequest,
  JobStatus,
  JobDetailsResponse,
  FortuneFinalResult,
  FortuneManifest,
  CvatManifest,
  JobType,
  StorageProviders,
} from '../types';
import api from '../utils/api';
import { getFilenameFromContentDisposition } from '../utils/string';

const buildFortuneManifest = (data: FortuneRequest): FortuneManifest => ({
  submissionsRequired: Number(data.fortunesRequested),
  requesterTitle: data.title,
  requesterDescription: data.description,
  requestType: JobType.FORTUNE,
  qualifications: data.qualifications,
});

const buildBucketUrl = ({
  provider,
  region,
  bucketName,
  path,
}: CvatRequest['data']['dataset']) => {
  if (provider === StorageProviders.AWS) {
    return `https://${bucketName}.s3.${region}.amazonaws.com${
      path ? `/${path.replace(/\/$/, '')}` : ''
    }`;
  }

  return `https://${bucketName}.storage.googleapis.com${path ? `/${path}` : ''}`;
};

const buildCvatManifest = (data: CvatRequest): CvatManifest => ({
  data: {
    dataUrl: buildBucketUrl(data.data.dataset),
    ...(data.data.points && {
      pointsUrl: buildBucketUrl(data.data.points),
    }),
    ...(data.data.boxes && {
      boxesUrl: buildBucketUrl(data.data.boxes),
    }),
  },
  annotation: {
    labels: data.labels,
    description: data.description,
    userGuide: data.userGuide,
    type: data.type,
    jobSize: CVAT_JOB_SIZE,
    ...(data.qualifications?.length && {
      qualifications: data.qualifications,
    }),
  },
  validation: {
    minQuality: Number(data.accuracyTarget) / 100,
    valSize: CVAT_VAL_SIZE,
    gtUrl: buildBucketUrl(data.groundTruth),
  },
  jobBounty: String(data.jobBounty),
});

export const createFortuneJob = async (
  chainId: number,
  data: FortuneRequest,
  paymentCurrency: string,
  paymentAmount: number | string,
  escrowFundToken: string,
) => {
  const body: CreateJobRequest<FortuneManifest> = {
    chainId,
    requestType: JobType.FORTUNE,
    paymentCurrency,
    paymentAmount: Number(paymentAmount),
    escrowFundToken,
    qualifications: data.qualifications,
    manifest: buildFortuneManifest(data),
  };
  await api.post('/job', body);
};

export const createCvatJob = async (
  chainId: number,
  data: CvatRequest,
  paymentCurrency: string,
  paymentAmount: number | string,
  escrowFundToken: string,
) => {
  const body: CreateJobRequest<CvatManifest> = {
    chainId,
    requestType: data.type,
    paymentCurrency,
    paymentAmount: Number(paymentAmount),
    escrowFundToken,
    qualifications: data.qualifications,
    manifest: buildCvatManifest(data),
  };
  await api.post('/job', body);
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
