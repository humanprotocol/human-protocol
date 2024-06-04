/* eslint-disable camelcase -- ... */
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import { ethKVStoreGetKycData } from '@/smart-contracts/EthKVStore/eth-kv-store-get-kyc-data';
import { getContractAddress } from '@/smart-contracts/get-contract-address';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';

export interface RegisterAddressPayload {
  address: string;
}

const RegisterAddressSuccessSchema = z.object({
  signed_address: z.string(),
});

export type RegisterAddressSuccess = z.infer<
  typeof RegisterAddressSuccessSchema
>;

export function useRegisterAddress() {
  const { user } = useAuthenticatedUser();
  const { web3ProviderMutation, address, chainId } = useConnectedWallet();
  return useQuery({
    queryFn: async () => {
      const signedAddress = await apiClient(
        apiPaths.worker.registerAddress.path,
        {
          authenticated: true,
          successSchema: RegisterAddressSuccessSchema,
          options: {
            method: 'POST',
            body: JSON.stringify({ address: user.address }),
          },
        }
      );

      const contractAddress = getContractAddress({
        chainId,
        contractName: 'EthKVStore',
      });

      const registeredAddressOnChain = await ethKVStoreGetKycData({
        contractAddress,
        accountAddress: address,
        signed_address: signedAddress.signed_address,
        kycKey: `KYC-${user.reputation_network}`,
        signer: web3ProviderMutation.data?.signer,
        chainId,
      });

      return {
        signedAddress: signedAddress.signed_address,
        registeredAddressOnChain,
        kycRegisteredOnChain:
          signedAddress.signed_address === registeredAddressOnChain,
      };
    },
    queryKey: [
      user.address,
      user.reputation_network,
      chainId,
      address,
      web3ProviderMutation.data?.signer,
    ],
  });
}
