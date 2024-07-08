/* eslint-disable camelcase -- ... */
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import { ethKVStoreGetKycData } from '@/smart-contracts/EthKVStore/eth-kv-store-get-kyc-data';
import { getContractAddress } from '@/smart-contracts/get-contract-address';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';

export interface RegisterAddressPayload {
  address: string;
}

export const RegisterAddressSuccessSchema = z.object({
  signed_address: z.string(),
});

export type RegisterAddressSuccess = z.infer<
  typeof RegisterAddressSuccessSchema
>;

export function useGetOnChainRegisteredAddress() {
  const { user } = useAuthenticatedUser();
  const { web3ProviderMutation, address, chainId } = useConnectedWallet();

  return useQuery({
    queryFn: async () => {
      const contractAddress = getContractAddress({
        chainId,
        contractName: 'EthKVStore',
      });

      const registeredAddressOnChain = await ethKVStoreGetKycData({
        contractAddress,
        accountAddress: address,
        kycKey: `KYC-${user.reputation_network}`,
        signer: web3ProviderMutation.data?.signer,
        chainId,
      });

      return registeredAddressOnChain;
    },
    retry: 0,
    refetchInterval: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryKey: [
      user.wallet_address,
      user.reputation_network,
      chainId,
      address,
      web3ProviderMutation.data?.signer,
    ],
  });
}
