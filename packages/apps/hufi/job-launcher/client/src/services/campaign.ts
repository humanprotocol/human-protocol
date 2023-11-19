import { ChainId } from '@human-protocol/sdk';
import { SUPPORTED_CHAIN_IDS } from '../constants/chains';
import {
  JobStatus,
  JobDetailsResponse,
  CreateCampaign,
  DeployedCampaign,
} from '../types';
import api from '../utils/api';
import exchangeOracle from '../utils/exchangeoracle';

export const createCampaign = async (chainId: number, data: CreateCampaign) => {
  const body: CreateCampaign = {
    chainId: chainId,
    startBlock: Number(data.startBlock),
    requesterDescription: data.requesterDescription,
    endBlock: Number(data.endBlock),
    exchangeName: data.exchangeName,
    tokenA: data.tokenA,
    tokenB: data.tokenB,
    campaignDuration: data.campaignDuration,
    fundAmount: Number(data.fundAmount),
    type: data.type,
  };
  const response = await api.post('/job/campaign', body);
  console.log(response.data);
  const launched = await api.get('/job/cron/launch');
  console.log(launched.data);
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

export const getCampaignsList = async (chainId: ChainId): Promise<string[]> => {
  const { data } = await exchangeOracle.get(`/job/campaigns/${chainId}`);
  return data;
};

export const getLaunchCron = async () => {};

export const getCampaignsDetailsData = async (
  chainId: ChainId,
  escrowList: Array<string>
) => {
  const promises = escrowList.map((escrowAddress) =>
    exchangeOracle.get<DeployedCampaign>(
      `/job/details/${chainId}/${escrowAddress}`
    )
  );

  const results = await Promise.all(promises);
  return results.map((response) => response.data);
};

export const getJobResult = async (jobId: number) => {
  const { data } = await api.get(`/job/result`, { params: { jobId } });
  return data;
};

export const getJobDetails = async (jobId: number) => {
  const { data } = await api.get<JobDetailsResponse>(`/job/details/${jobId}`);
  return data;
};
