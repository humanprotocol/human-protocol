/* eslint-disable camelcase -- ... */
import { useMutation } from '@tanstack/react-query';
import type { JsonRpcSigner } from 'ethers';
import type { RegisterAddressSuccess } from '@/api/servieces/worker/register-address';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import { ethKvStoreSetBulk } from '@/smart-contracts/EthKVStore/eth-kv-store-set-bulk';
import { getContractAddress } from '@/smart-contracts/get-contract-address';

async function registerAddressInKVStore({
  signed_address,
  oracleAddress,
  signer,
  chainId,
}: RegisterAddressSuccess & {
  oracleAddress: string;
  signer?: JsonRpcSigner;
  chainId: number;
}) {
  const contractAddress = getContractAddress({
    chainId,
    contractName: 'EthKVStore',
  });

  await ethKvStoreSetBulk({
    keys: [`KYC-${oracleAddress}`],
    values: [signed_address],
    signer,
    chainId,
    contractAddress,
  });
}

export function useSetKycOnChain({
  signed_address,
}: {
  signed_address: string;
}) {
  const { user } = useAuthenticatedUser();
  const { web3ProviderMutation, chainId } = useConnectedWallet();
  return useMutation({
    mutationFn: async () => {
      await registerAddressInKVStore({
        signed_address,
        signer: web3ProviderMutation.data?.signer,
        oracleAddress: user.reputation_network,
        chainId,
      });
    },
    mutationKey: [user.address],
  });
}
