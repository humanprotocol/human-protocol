import { useQuery } from '@tanstack/react-query';

import * as oraclesService from '../services/oracles.service';

export function useGetOracles() {
  return useQuery({
    queryFn: async () => oraclesService.getOracles(),
    queryKey: ['oracles'],
  });
}
