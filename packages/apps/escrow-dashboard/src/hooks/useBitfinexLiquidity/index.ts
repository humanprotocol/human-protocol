/* eslint-disable camelcase */
import HMTokenABI from '@human-protocol/core/abis/HMToken.json';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import {
  ChainId,
  BITFINEX_SUPPORTED_CHAIN_IDS,
  BITFINEX_HOT_WALLET_ADDRESS,
  HMT_ADDRESSES,
} from 'src/constants';

type BitfinexLiquidity = { [chainId in ChainId]?: string };

export default function useBitfinexLiquidity() {
  const [liquidity, setLiquidity] = useState<BitfinexLiquidity>();

  useEffect(() => {
    const _liquidity: BitfinexLiquidity = {};
    const promises = BITFINEX_SUPPORTED_CHAIN_IDS.map(async (chainId) => {
      const provider = new ethers.providers.JsonRpcProvider();
      const contract = new ethers.Contract(
        HMT_ADDRESSES[chainId]!,
        HMTokenABI,
        provider
      );
      const balance = await contract.balanceOf(BITFINEX_HOT_WALLET_ADDRESS);
      _liquidity[chainId] = balance.toString();
    });
    Promise.all(promises).then((res) => setLiquidity(_liquidity));
  }, []);

  return liquidity;
}
