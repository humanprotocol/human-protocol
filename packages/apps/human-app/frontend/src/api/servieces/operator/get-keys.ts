import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';
import { get } from '@/smart-contracts/EthKVStore/get-all-keys';
import { getContractAddress } from '@/smart-contracts/get-contract-address';
import { EthKVStoreKeys } from '@/smart-contracts/EthKVStore/config';

export const getEthKVStoreValuesSuccessSchema = z.object({
  [EthKVStoreKeys.PublicKey]: z.string().optional(),
  [EthKVStoreKeys.WebhookUrl]: z.string().optional(),
  [EthKVStoreKeys.Role]: z
    .string()
    .optional()
    .transform((role) => {
      if (!role) return [];
      return [role];
    }),
  [EthKVStoreKeys.RecordingOracle]: z.string().optional(),
});

export type GetEthKVStoreValuesSuccessResponse = z.infer<
  typeof getEthKVStoreValuesSuccessSchema
>;

export function useGetKeys() {
  const {
    chainId,
    address,
    web3ProviderMutation: { data },
  } = useConnectedWallet();

  return useQuery({
    queryFn: async () => {
      const contractAddress = getContractAddress({
        chainId,
        contractName: 'EthKVStore',
      });
      const result = await get({
        accountAddress: address,
        contractAddress,
        chainId,
        signer: data?.signer,
      });

      const validData = getEthKVStoreValuesSuccessSchema.parse(result);
      return validData;
    },
    queryKey: [chainId, address, data?.signer],
  });
}
