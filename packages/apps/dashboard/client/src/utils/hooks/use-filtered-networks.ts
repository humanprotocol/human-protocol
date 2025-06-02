import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiPaths } from '@/services/api-paths';
import { httpService } from '@/services/http-service';
import { networks as allNetworks } from '@/utils/config/networks';

const enabledChainsSchema = z.array(z.number());

export const useFilteredNetworks = () => {
  const {
    data: enabledChains,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['enabledChains'],
    queryFn: async () => {
      const response = await httpService.get(apiPaths.enabledChains.path);
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
