import { ChainId, IKVStore, KVStoreClient } from '@human-protocol/sdk';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { SUPPORTED_CHAIN_IDS } from '../constants/chains';
import { useSnackbar } from '../providers/SnackProvider';
import { parseErrorMessage } from '../utils/string';
import axios from 'axios';

const DASHBOARD_API_URL = import.meta.env.VITE_APP_DASHBOARD_API_URL;

export const useKVStore = () => {
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { showError, openSnackbar } = useSnackbar();

  const [kvStore, setKVStore] = useState<IKVStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [kvstoreClient, setKVStoreClient] = useState<KVStoreClient | null>(
    null
  );

  const fetchKVStore = async () => {
    setLoading(true);
    try {
      if (address && chainId) {
        const response = await axios.get(
          `${DASHBOARD_API_URL}/details/kvstore/${address}`,
          {
            params: {
              chain_id: chainId,
            },
          }
        );
        setKVStore(response.data);
      }
    } catch (err) {
      console.error(err);
      showError('Failed to fetch KVStore data');
    } finally {
      setLoading(false);
    }
  };

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
        showError(parseErrorMessage(error));
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

  const set = async (key: string, value: string) => {
    setLoading(true);
    try {
      checkSupportedChain();
      if (kvstoreClient && key) {
        await kvstoreClient.set(key, value);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        openSnackbar('KVStore updated successfully!', 'success');
        await fetchKVStore();
      }
    } catch (err) {
      showError(parseErrorMessage(err));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setBulk = async (keys: string[], values: string[]) => {
    setLoading(true);
    try {
      checkSupportedChain();
      if (kvstoreClient) {
        await kvstoreClient.setBulk(keys, values);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        openSnackbar('KVStore updated successfully!', 'success');
        await fetchKVStore();
      }
    } catch (err) {
      showError(parseErrorMessage(err));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { kvStore, fetchKVStore, set, setBulk, loading };
};
