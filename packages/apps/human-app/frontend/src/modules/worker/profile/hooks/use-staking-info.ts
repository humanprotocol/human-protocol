import { useCallback, useEffect, useState } from 'react';
import { StakerInfo, StakingClient } from '@human-protocol/sdk';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useConnectedWallet } from '@/shared/contexts/wallet-connect';

export const useStakingInfo = () => {
  const [stakingClient, setStakingClient] = useState<StakingClient | null>(
    null
  );
  const [isClientInitializing, setIsClientInitializing] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isError, setIsError] = useState(false);
  const [data, setData] = useState<StakerInfo | null>(null);

  const {
    user: { wallet_address: walletAddress },
  } = useAuthenticatedUser();

  const { web3ProviderMutation } = useConnectedWallet();
  const { provider } = web3ProviderMutation.data || {};

  useEffect(() => {
    const initStakingClient = async () => {
      if (!provider) {
        return;
      }
      try {
        setIsClientInitializing(true);
        const client = await StakingClient.build(provider);
        setStakingClient(client);
        setIsError(false);
      } catch (error) {
        console.error('Failed to init staking client', error);
        setStakingClient(null);
        setIsError(true);
      } finally {
        setIsClientInitializing(false);
      }
    };

    initStakingClient();
  }, [provider]);

  const fetchStakingData = useCallback(async () => {
    if (stakingClient && walletAddress) {
      setIsFetching(true);
      try {
        // const stakingInfo = await stakingClient.getStakerInfo(
        //   '0x63099ef7f337d85f45e2e481e78d129fb6af739d'
        // );
        const stakingInfo = await stakingClient.getStakerInfo(walletAddress);
        setData(stakingInfo);
        setIsError(false);
      } catch (error) {
        setIsError(true);
        console.error('Error fetching staking data', error);
        return null;
      } finally {
        setIsFetching(false);
      }
    } else {
      setData(null);
    }
  }, [stakingClient, walletAddress]);

  useEffect(() => {
    if (stakingClient && walletAddress) {
      fetchStakingData();
    }
  }, [stakingClient, walletAddress, fetchStakingData]);

  return {
    data,
    isError,
    isLoading: isClientInitializing || isFetching,
  };
};
