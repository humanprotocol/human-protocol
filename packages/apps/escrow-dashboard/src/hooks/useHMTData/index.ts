/* eslint-disable camelcase */
import { useEffect, useState } from 'react';

type HMTData = {
  circulatingSupply: number;
  totalSupply: number;
  currentPriceInUSD: number;
  priceChangePercentage24h: number;
};

export default function useHMTData() {
  const [data, setData] = useState<HMTData>();

  useEffect(() => {
    fetch(
      `https://api.coingecko.com/api/v3/coins/ethereum/contract/0xd1ba9BAC957322D6e8c07a160a3A8dA11A0d2867`
    )
      .then((res) => res.json())
      .then((json) => {
        const { market_data } = json;
        setData({
          circulatingSupply: market_data.circulating_supply,
          totalSupply: market_data.total_supply,
          currentPriceInUSD: market_data.current_price.usd,
          priceChangePercentage24h: market_data.price_change_percentage_24h,
        });
      });
  }, []);

  return data;
}
