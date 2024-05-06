/* eslint-disable camelcase -- api response*/
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useTableQuery } from '@/components/ui/table/table-query-hook';
import { getJobsTableData } from './available-jobs-table-service-mock';

const AvailableJobsSchema = z.object({
  escrow_address: z.string(),
  chain_id: z.number(),
  job_type: z.string(),
  status: z.string(),
});

const MyJobsSchema = z.object({
  page: z.number(),
  page_size: z.number(),
  total_pages: z.number(),
  total_results: z.number(),
  results: z.array(AvailableJobsSchema),
});

type AvailableJobs = z.infer<typeof MyJobsSchema>;

export function useGetAvailableJobsData() {
  const {
    fields: { sorting, pagination },
  } = useTableQuery();

  return useQuery<AvailableJobs>({
    queryKey: ['AvailableJobs', [sorting, pagination]],
    queryFn: getJobsTableData,
  });
}
