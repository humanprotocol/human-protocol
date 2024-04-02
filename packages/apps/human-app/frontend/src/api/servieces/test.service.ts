import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { apiPaths } from '../api-paths';
import { testSchema } from './test.schema';

function getTest() {
  return apiClient(apiPaths.test.path, {
    options: { method: 'GET' },
    successSchema: testSchema,
  });
}

export function useGetTest() {
  return useQuery({
    queryKey: ['test'],
    retry: false,
    queryFn: getTest,
  });
}
