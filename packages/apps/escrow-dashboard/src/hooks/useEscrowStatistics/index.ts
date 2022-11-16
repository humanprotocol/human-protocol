import { useEffect, useState } from 'react';
import { RAW_ESCROW_STATS_QUERY } from 'src/queries';
import { gqlFetch } from 'src/utils/gqlFetch';
import { useNetwork } from '../useNetwork';

interface IEscrowStatistics {
  intermediateStorageEventCount: string;
  pendingEventCount: string;
  bulkTransferEventCount: string;
}

export default function useEscrowStatistics() {
  const { network } = useNetwork();
  const [_escrowStatistics, setEscrowStatistics] =
    useState<IEscrowStatistics>();

  useEffect(() => {
    const fetchData = async (url: string) => {
      const res = await gqlFetch(url, RAW_ESCROW_STATS_QUERY);
      const json = await res.json();
      const {
        data: { escrowStatistics },
      } = json;

      setEscrowStatistics(escrowStatistics);
    };
    if (network && network.graphqlClientUrl) {
      fetchData(network.graphqlClientUrl);
    }
  }, [network]);

  return _escrowStatistics;
}
