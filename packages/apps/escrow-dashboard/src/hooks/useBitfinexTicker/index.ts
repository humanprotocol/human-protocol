/* eslint-disable camelcase */
import HMTokenABI from '@human-protocol/core/abis/HMToken.json';
import axios from 'axios';
import { useEffect, useState } from 'react';

type BitfinexTicker = {
  frr?: number;
  bid: number;
  bidPeriod?: number;
  bidSize: number;
  ask: number;
  askPeriod?: number;
  askSize: number;
  dailyChange: number;
  dailyChangeRelative: number;
  lastPrice: number;
  volume: number;
  high: number;
  low: number;
  frrAmountAvailable?: number;
};

export default function useBitfinexTicker() {
  const [ticker, setTicker] = useState<BitfinexTicker>();
  const url =
    'https://api.allorigins.win/get?url=https://api-pub.bitfinex.com/v2/ticker/tHMTUSD';

  useEffect(() => {
    axios.get(url).then((res) => {
      const response: number[] = JSON.parse(res.data.contents);
      setTicker({
        bid: response[0],
        bidSize: response[1],
        ask: response[2],
        askSize: response[3],
        dailyChange: response[4],
        dailyChangeRelative: response[5],
        lastPrice: response[6],
        volume: response[7],
        high: response[8],
        low: response[6],
      });
    });
  }, []);

  return ticker;
}
