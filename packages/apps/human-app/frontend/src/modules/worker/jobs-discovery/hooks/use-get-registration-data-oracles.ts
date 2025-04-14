import { useQuery } from '@tanstack/react-query';
import { jobsDiscoveryService } from '../services/jobs-discovery.service';

export function useGetRegistrationDataInOracles() {
  return useQuery({
    queryFn: async () => {
      return jobsDiscoveryService.getRegistrationDataOracles();
    },
    queryKey: ['getRegistrationDataInOracles'],
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 0,
  });
}
