import HMTokenABI from "@human-protocol/core/abis/HMToken.json";
import {
  ChainId,
  NETWORKS,
  StakerInfo,
  StakingClient,
} from "@human-protocol/sdk";
import { Eip1193Provider, ethers } from "ethers";
import { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { useSnackbar } from "../providers/SnackProvider";
import { parseErrorMessage } from "../utils/string";
import { formatAmount } from "../utils/units";
import { SUPPORTED_CHAIN_IDS } from "../constants/chains";

export const useStake = () => {
  const { address, chainId, connector } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { showError, openSnackbar } = useSnackbar();

  const [stakingClient, setStakingClient] = useState<StakingClient | null>(
    null,
  );
  const [stakingData, setStakingData] = useState<StakerInfo | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [browserProvider, setBrowserProvider] =
    useState<ethers.BrowserProvider | null>(null);

  useEffect(() => {
    const initStakingClient = async () => {
      try {
        if (walletClient && address && connector) {
          checkSupportedChain();
          const eeip193Provider = await connector?.getProvider();
          const provider = new ethers.BrowserProvider(
            eeip193Provider as Eip1193Provider,
          );
          setBrowserProvider(provider);
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
  }, [walletClient, address, chainId, connector]);

  const checkSupportedChain = () => {
    const isSupportedChain = SUPPORTED_CHAIN_IDS.includes(chainId as ChainId);
    if (!isSupportedChain) {
      resetData();
      throw new Error(
        "Unsupported chain. Please switch to a supported network.",
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
    } catch {
      showError("Error fetching staking data");
    }
  };

  const fetchTokenBalance = async (
    provider: ethers.BrowserProvider,
    address: string,
    chainId?: number,
  ) => {
    checkSupportedChain();
    try {
      const tokenAddress = NETWORKS[chainId as ChainId]?.hmtAddress;
      if (!tokenAddress) {
        showError("Token address not found for this network");
        return;
      }

      const tokenContract = new ethers.Contract(
        tokenAddress,
        HMTokenABI,
        provider,
      );
      const balance = await tokenContract.balanceOf(address);

      setTokenBalance(formatAmount(balance));
    } catch {
      showError("Error fetching token balance");
    }
  };

  const handleStake = async (amount: string) => {
    if (!browserProvider) return;

    try {
      checkSupportedChain();
      if (stakingClient && amount && address) {
        const weiAmount = ethers.parseUnits(amount, "ether");
        await stakingClient.approveStake(weiAmount);
        await stakingClient.stake(weiAmount);
        await fetchStakingData(stakingClient);
        await fetchTokenBalance(browserProvider, address, chainId);
        openSnackbar("Stake successful", "success");
      }
    } catch (error) {
      showError(parseErrorMessage(error));
      throw error;
    }
  };

  const handleUnstake = async (amount: string) => {
    if (!browserProvider) return;

    try {
      checkSupportedChain();
      if (stakingClient && amount && address) {
        const weiAmount = ethers.parseUnits(amount, "ether");
        await stakingClient.unstake(weiAmount);
        await fetchStakingData(stakingClient);
        await fetchTokenBalance(browserProvider, address, chainId);
        openSnackbar("Unstake successful", "success");
      }
    } catch (error) {
      showError(parseErrorMessage(error));
      throw error;
    }
  };

  const handleWithdraw = async () => {
    if (!browserProvider) return;

    try {
      checkSupportedChain();
      if (stakingClient && address) {
        await stakingClient.withdraw();
        await fetchStakingData(stakingClient);
        await fetchTokenBalance(browserProvider, address, chainId);
        openSnackbar("Withdraw successful", "success");
      }
    } catch (error) {
      showError(parseErrorMessage(error));
      throw error;
    }
  };

  return {
    tokenBalance,
    stakedAmount: stakingData?.stakedAmount
      ? formatAmount(stakingData?.stakedAmount)
      : "0",
    lockedAmount: stakingData?.lockedAmount
      ? formatAmount(stakingData?.lockedAmount)
      : "0",
    lockedUntil: stakingData?.lockedUntil,
    withdrawableAmount: stakingData?.withdrawableAmount
      ? formatAmount(stakingData?.withdrawableAmount)
      : "0",
    handleStake,
    handleUnstake,
    handleWithdraw,
  };
};
