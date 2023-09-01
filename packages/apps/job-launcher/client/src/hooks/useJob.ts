import { ChainId, EscrowClient } from '@human-protocol/sdk';
import { EscrowData } from '@human-protocol/sdk/dist/graphql';
import axios from 'axios';
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
    const client = await EscrowClient.build(provider);
    const subgraphUrl = client.network.subgraphUrl;

    const { data } = await axios.post<{ data: { escrow: EscrowData } }>(
      subgraphUrl,
      {
        query: `
          {
            escrow(id: "${address?.toLowerCase()}") {
              id
              intermediateResultsUrl
              address
              amountPaid
              balance
              count
              createdAt
              factoryAddress
              finalResultsUrl
              jobRequesterId
              launcher
              manifestHash
              manifestUrl
              recordingOracle
              recordingOracleFee
              reputationOracle
              reputationOracleFee
              status
              token
              totalFundedAmount
            }
          }
        `,
      }
    );

    return data.data.escrow;
  });
};
