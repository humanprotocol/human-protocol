import { useEffect, useState } from 'react';

export default function useHMTData() {
  const [price, setPrice] = useState<number>();
  useEffect(() => {
    if (!price) {
      fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=human-protocol&vs_currencies=usd`
      )
        .then((res) => res.json())
        .then((json) => setPrice(json['human-protocol'].usd));
    }
  }, []);

  return price;
}
