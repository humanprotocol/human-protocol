import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { JsonRpcSigner } from 'ethers';
import { t } from 'i18next';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import { ethKvStoreSetBulk } from '@/smart-contracts/EthKVStore/eth-kv-store-set-bulk';
import { getContractAddress } from '@/smart-contracts/get-contract-address';
import type { SignedAddressSuccess } from '@/api/servieces/worker/get-signed-address';

async function registerAddressInKVStore({
  key,
  value,
  signer,
  chainId,
}: {
  key: string;
  value: string;
  signer?: JsonRpcSigner;
  chainId: number;
}) {
  const contractAddress = getContractAddress({
    chainId,
    contractName: 'EthKVStore',
  });

  await ethKvStoreSetBulk({
    keys: [key],
    values: [value],
    signer,
    chainId,
    contractAddress,
  });
}

export function useRegisterAddressOnChainMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuthenticatedUser();
  const { web3ProviderMutation, chainId, address } = useConnectedWallet();

  return useMutation({
    mutationFn: async (data: SignedAddressSuccess) => {
      if (address.toLowerCase() !== user.wallet_address?.toLowerCase()) {
        throw new Error(t('worker.profile.wrongWalletAddress'));
      }

      await registerAddressInKVStore({
        ...data,
        signer: web3ProviderMutation.data?.signer,
        chainId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
    mutationKey: [user.wallet_address],
  });
}
