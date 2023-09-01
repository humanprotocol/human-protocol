import { ChainId, EscrowClient } from '@human-protocol/sdk';
import { ethers } from 'ethers';
import useSWR from 'swr';
import { RPC_URLS } from '../constants/chains';

export const useJob = ({
  chainId,
  address,
}: {
  chainId?: string;
  address?: string;
}) => {
  return useSWR(`human-protocol-job-${chainId}-${address}`, async () => {
    const provider = new ethers.providers.JsonRpcProvider(
      RPC_URLS[Number(chainId) as ChainId]
    );
    try {
      const client = await EscrowClient.build(provider);

      console.log(client.network.subgraphUrl);

      const [
        balance,
        manifestUrl,
        resultsUrl,
        tokenAddress,
        recordingOracleAddress,
        reputationOracleAddress,
        jobLauncherAddress,
      ] = await Promise.all([
        client.getBalance(address!),
        client.getManifestUrl(address!),
        client.getResultsUrl(address!),
        client.getTokenAddress(address!),
        client.getRecordingOracleAddress(address!),
        client.getReputationOracleAddress(address!),
        client.getJobLauncherAddress(address!),
      ]);

      console.log(
        balance,
        manifestUrl,
        resultsUrl,
        tokenAddress,
        recordingOracleAddress,
        reputationOracleAddress,
        jobLauncherAddress
      );
    } catch (err) {
      console.log(err);
    }
  });
};
