/* eslint-disable camelcase -- ... */
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import { ethKVStoreGetKycData } from '@/smart-contracts/EthKVStore/eth-kv-store-get-kyc-data';
import { getContractAddress } from '@/smart-contracts/get-contract-address';
import { useWalletConnect } from '@/hooks/use-wallet-connect';

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
  const { address } = useWalletConnect();

  return useQuery({
    queryFn: async () => {
      const contractAddress = getContractAddress({
        contractName: 'EthKVStore',
      });

      const registeredAddressOnChain = await ethKVStoreGetKycData({
        contractAddress,
        accountAddress: user.wallet_address || address || '',
        kycKey: `KYC-${user.reputation_network}`,
      });

      return registeredAddressOnChain;
    },
    retry: 0,
    refetchInterval: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryKey: [user.wallet_address, user.reputation_network, address],
  });
}
