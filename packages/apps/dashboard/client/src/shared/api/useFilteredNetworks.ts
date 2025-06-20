import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import apiPaths from '@/shared/api/apiPaths';
import httpClient from '@/shared/api/httpClient';
import { networks as allNetworks } from '@/shared/lib/networks';

const enabledChainsSchema = z.array(z.number());

const useFilteredNetworks = () => {
  const {
    data: enabledChains,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['enabledChains'],
    queryFn: async () => {
      const response = await httpClient.get(apiPaths.enabledChains.path);
      return enabledChainsSchema.parse(response.data);
    },
  });

  const filteredNetworks = useMemo(() => {
    return enabledChains
      ? allNetworks.filter((network) => enabledChains.includes(network.id))
      : [];
  }, [enabledChains]);

  return { filteredNetworks, isLoading, error };
};

export default useFilteredNetworks;
