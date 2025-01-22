import HMTokenABI from '@human-protocol/core/abis/HMToken.json';
import {
  ChainId,
  NETWORKS,
  StakerInfo,
  StakingClient,
} from '@human-protocol/sdk';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useSnackbar } from '../providers/SnackProvider';
import { parseErrorMessage } from '../utils/string';
import { formatAmount } from '../utils/units';
import { SUPPORTED_CHAIN_IDS } from '../constants/chains';

export const useStake = () => {
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { showError, openSnackbar } = useSnackbar();

  const [stakingClient, setStakingClient] = useState<StakingClient | null>(
    null
  );
  const [stakingData, setStakingData] = useState<StakerInfo | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);

  useEffect(() => {
    const initStakingClient = async () => {
      try {
        checkSupportedChain();
        if (walletClient && address) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();

          const client = await StakingClient.build(signer);
          setStakingClient(client);
          await fetchStakingData(client);
          await fetchTokenBalance(provider, address, chainId);
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
    setStakingData(null);
    setTokenBalance(0);
  };

  const fetchStakingData = async (stakingClient: StakingClient) => {
    checkSupportedChain();
    try {
      const stakingInfo = await stakingClient.getStakerInfo(address!);
      setStakingData(stakingInfo);
    } catch (error) {
      showError('Error fetching staking data');
    }
  };

  const fetchTokenBalance = async (
    provider: ethers.BrowserProvider,
    address: string,
    chainId?: number
  ) => {
    checkSupportedChain();
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
    }
  };

  const handleStake = async (amount: string) => {
    try {
      checkSupportedChain();
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
      checkSupportedChain();
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
      checkSupportedChain();
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
