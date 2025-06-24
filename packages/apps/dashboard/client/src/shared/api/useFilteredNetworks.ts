import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { networks as allNetworks } from '@/shared/lib/networks';

import apiPaths from './apiPaths';
import httpClient from './httpClient';

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
