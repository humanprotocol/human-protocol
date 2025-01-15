import HMTokenABI from '@human-protocol/core/abis/HMToken.json';
import {
  ChainId,
  NETWORKS,
  StakerInfo,
  StakingClient,
} from '@human-protocol/sdk';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useAccount, useChainId, useWalletClient } from 'wagmi';
import { useSnackbar } from '../providers/SnackProvider';
import { parseErrorMessage } from '../utils/string';
import { formatAmount } from '../utils/units';

export const useStake = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { showError, openSnackbar } = useSnackbar();

  const [stakingClient, setStakingClient] = useState<StakingClient | null>(
    null
  );
  const [stakingData, setStakingData] = useState<StakerInfo | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);

  useEffect(() => {
    const initStakingClient = async () => {
      try {
        if (walletClient && address) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();

          const client = await StakingClient.build(signer);
          setStakingClient(client);

          await fetchStakingData(client);
          await fetchTokenBalance(provider, address, chainId);
        }
      } catch (error) {
        showError('Error initializing staking client');
      }
    };

    initStakingClient();
  }, [walletClient, address, chainId]);

  const fetchStakingData = async (stakingClient: StakingClient) => {
    try {
      const stakingInfo = await stakingClient.getStakerInfo(address!);
      setStakingData(stakingInfo);
    } catch (error) {
      showError('Error fetching staking data');
      console.error(error);
    }
  };

  const fetchTokenBalance = async (
    provider: ethers.BrowserProvider,
    address: string,
    chainId: number
  ) => {
    try {
      const tokenAddress = NETWORKS[chainId as ChainId]?.hmtAddress;
      if (!tokenAddress) {
        showError('Token address not found for this network');
        return;
      }

      const tokenContract = new ethers.Contract(
        tokenAddress,
        HMTokenABI,
        provider
      );
      const balance = await tokenContract.balanceOf(address);

      setTokenBalance(formatAmount(balance));
    } catch (error) {
      showError('Error fetching token balance');
      console.error('Error fetching token balance:', error);
    }
  };

  const handleStake = async (amount: string) => {
    try {
      if (stakingClient && amount) {
        const weiAmount = ethers.parseUnits(amount, 'ether');
        await stakingClient.approveStake(weiAmount);
        await stakingClient.stake(weiAmount);
        await fetchStakingData(stakingClient);
        await fetchTokenBalance(
          new ethers.BrowserProvider(window.ethereum),
          address!,
          chainId
        );
        openSnackbar('Stake successful', 'success');
      }
    } catch (error) {
      showError(parseErrorMessage(error));
    }
  };

  const handleUnstake = async (amount: string) => {
    try {
      if (stakingClient && amount) {
        const weiAmount = ethers.parseUnits(amount, 'ether');
        await stakingClient.unstake(weiAmount);
        await fetchStakingData(stakingClient);
        await fetchTokenBalance(
          new ethers.BrowserProvider(window.ethereum),
          address!,
          chainId
        );
        openSnackbar('Unstake successful', 'success');
      }
    } catch (error) {
      showError(parseErrorMessage(error));
    }
  };

  const handleWithdraw = async () => {
    try {
      if (stakingClient) {
        await stakingClient.withdraw();
        await fetchStakingData(stakingClient);
        await fetchTokenBalance(
          new ethers.BrowserProvider(window.ethereum),
          address!,
          chainId
        );
        openSnackbar('Withdraw successful', 'success');
      }
    } catch (error) {
      showError(parseErrorMessage(error));
    }
  };

  return {
    tokenBalance,
    stakedAmount: stakingData?.stakedAmount
      ? formatAmount(stakingData?.stakedAmount)
      : '0',
    lockedAmount: stakingData?.lockedAmount
      ? formatAmount(stakingData?.lockedAmount)
      : '0',
    lockedUntil: stakingData?.lockedUntil,
    withdrawableAmount: stakingData?.withdrawableAmount
      ? formatAmount(stakingData?.withdrawableAmount)
      : '0',
    handleStake,
    handleUnstake,
    handleWithdraw,
  };
};
