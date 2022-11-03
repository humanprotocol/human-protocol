import { useEffect, useState } from 'react';
import { RAW_TOKEN_STATS_QUERY } from 'src/queries';
import { gqlFetch } from 'src/utils/gqlFetch';
import { useNetwork } from '../useNetwork';

interface ITokenStatistics {
  totalApprovalEventCount: string;
  totalTransferEventCount: string;
  totalValueTransfered: string;
  token: string;
  holders: string;
}

export default function useTokenStatistics() {
  const { network } = useNetwork();
  const [tokenStatistics, setTokenStatistics] = useState<ITokenStatistics>();

  useEffect(() => {
    const fetchData = async (url: string) => {
      const res = await gqlFetch(url, RAW_TOKEN_STATS_QUERY);
      const json = await res.json();
      const {
        data: { hmtokenStatistics },
      } = json;

      setTokenStatistics(hmtokenStatistics);
    };
    if (network && network.graphqlClientUrl) {
      fetchData(network.graphqlClientUrl);
    }
  }, [network]);

  return tokenStatistics;
}
