import { useState, useEffect } from 'react';
import {
  ChainId,
  IKVStore,
  KVStoreClient,
  KVStoreUtils,
} from '@human-protocol/sdk';
import { useAccount, useWalletClient } from 'wagmi';
import { useSnackbar } from '../providers/SnackProvider';
import { SUPPORTED_CHAIN_IDS } from '../constants/chains';
import { ethers } from 'ethers';

export const useKVStore = () => {
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { showError, openSnackbar } = useSnackbar();

  const [kvStore, setKVStore] = useState<IKVStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kvstoreClient, setKVStoreClient] = useState<KVStoreClient | null>(
    null
  );

  const fetchKVStore = async () => {
    setLoading(true);
    try {
      if (address && chainId) {
        const data = await KVStoreUtils.getKVStoreData(chainId, address);
        setKVStore(data);
      }
    } catch (err) {
      setError('Failed to fetch KVStore data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKVStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, chainId]);

  useEffect(() => {
    const initStakingClient = async () => {
      try {
        checkSupportedChain();
        if (walletClient && address) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();

          const client = await KVStoreClient.build(signer);
          setKVStoreClient(client);
          await fetchKVStore();
        }
      } catch (error) {
        showError(error);
        resetData();
      }
    };

    initStakingClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletClient, address, chainId]);

  const checkSupportedChain = () => {
    const isSupportedChain = SUPPORTED_CHAIN_IDS.includes(chainId as ChainId);
    if (!isSupportedChain) {
      resetData();
      throw new Error(
        'Unsupported chain. Please switch to a supported network.'
      );
    }
  };

  const resetData = () => {
    setKVStore([]);
  };

  const updateKVStore = async (key: string, value: string) => {
    setLoading(true);
    try {
      if (kvstoreClient && key) {
        await kvstoreClient.set(key, value);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        openSnackbar('KVStore updated successfully!', 'success');
        await fetchKVStore();
      }
    } catch (err) {
      console.error(err);
      showError('Failed to update KV Store');
    } finally {
      setLoading(false);
    }
  };

  const setBulk = async (keys: string[], values: string[]) => {
    setLoading(true);
    try {
      if (kvstoreClient) {
        await kvstoreClient.setBulk(keys, values);
        openSnackbar('KVStore updated successfully!', 'success');
        await fetchKVStore();
      }
    } catch (err) {
      console.error(err);
      showError('Failed to update KV Store');
    } finally {
      setLoading(false);
    }
  };

  return { kvStore, fetchKVStore, updateKVStore, setBulk, loading, error };
};
