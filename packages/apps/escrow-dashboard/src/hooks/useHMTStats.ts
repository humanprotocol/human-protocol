import HMTokenABI from '@human-protocol/core/abis/HMToken.json';
import { ChainId, NETWORKS, StatisticsClient } from '@human-protocol/sdk';
import BigNumberJS from 'bignumber.js';
import { Contract, providers, utils } from 'ethers';
import useSWR from 'swr';
import { HM_TOKEN_DECIMALS, RPC_URLS } from 'src/constants';
import { useChainId } from 'src/state/humanAppData/hooks';

const fetchTotalSupply = async (chainId: ChainId) => {
  const rpcUrl = RPC_URLS[chainId]!;
  const hmtAddress = NETWORKS[chainId]?.hmtAddress!;
  const provider = new providers.JsonRpcProvider(rpcUrl);
  const contract = new Contract(hmtAddress, HMTokenABI, provider);
  const totalSupplyBN = await contract.totalSupply();
  return new BigNumberJS(
    utils.formatUnits(totalSupplyBN, HM_TOKEN_DECIMALS)
  ).toJSON();
};

export function useHMTStats() {
  const chainId = useChainId();
  return useSWR(`human-protocol-dashboard-hmt-stats-${chainId}`, async () => {
    const network = NETWORKS[chainId];
    if (!network) return null;
    const client = new StatisticsClient(network);

    const stats = await client.getHMTStatistics();
    const totalSupply = await fetchTotalSupply(chainId);

    return {
      dailyHMTData: stats.dailyHMTData,
      totalTransferAmount: utils.formatUnits(
        stats.totalTransferAmount,
        HM_TOKEN_DECIMALS
      ),
      totalTransferCount: stats.totalTransferCount,
      holders: stats.totalHolders,
      totalSupply,
    };
  });
}
