import { useQuery } from '@tanstack/react-query';
import { jobsService } from '../services/jobs.service';

export function useGetUiConfig() {
  return useQuery({
    queryKey: ['ui-config'],
    queryFn: async () => jobsService.getUiConfig(),
    staleTime: Infinity,
  });
}
