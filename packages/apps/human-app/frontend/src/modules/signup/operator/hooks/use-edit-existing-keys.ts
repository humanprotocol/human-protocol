import { useMutation, useMutationState } from '@tanstack/react-query';
import last from 'lodash/last';
import { useNavigate } from 'react-router-dom';
import type { JsonRpcSigner } from 'ethers';
import { routerPaths } from '@/router/router-paths';
import { useConnectedWallet } from '@/shared/contexts/wallet-connect';
import { ethKvStoreSetBulk } from '@/modules/smart-contracts/EthKVStore/eth-kv-store-set-bulk';
import { getContractAddress } from '@/modules/smart-contracts/get-contract-address';
import { type EditEthKVStoreValuesMutationData } from '../schema';

function editExistingKeysMutationFn(
  formData: EditEthKVStoreValuesMutationData,
  userData: {
    accountAddress: string;
    chainId: number;
    signer?: JsonRpcSigner;
  }
) {
  const contractAddress = getContractAddress({
    contractName: 'EthKVStore',
  });

  const keys: string[] = [];
  const values: string[] = [];

  Object.entries(formData).forEach(([formFieldName, formFieldValue]) => {
    if (!formFieldValue) {
      return;
    }
    keys.push(formFieldName);
    values.push(formFieldValue.toString());
  });

  return ethKvStoreSetBulk({
    keys,
    values,
    contractAddress,
    chainId: userData.chainId,
    signer: userData.signer,
  });
}

export function useEditExistingKeysMutation() {
  const {
    address,
    chainId,
    web3ProviderMutation: { data: web3Data },
  } = useConnectedWallet();

  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: EditEthKVStoreValuesMutationData) =>
      editExistingKeysMutationFn(data, {
        accountAddress: address,
        chainId,
        signer: web3Data?.signer,
      }),
    onSuccess: () => {
      navigate(routerPaths.operator.editExistingKeysSuccess);
    },
    mutationKey: ['editKeys', address],
  });
}

export function useEditExistingKeysMutationState() {
  const { address } = useConnectedWallet();

  const state = useMutationState({
    filters: { mutationKey: ['editKeys', address] },
    select: (mutation) => mutation.state,
  });

  return last(state);
}
