/* eslint-disable camelcase -- api response*/
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { getJobsTableData } from '@/pages/worker/jobs/components/my-jobs/my-jobs-table-service';
import { useTableQuery } from '@/components/ui/table/table-query-hook';

const JobsSchema = z.object({
  assignment_id: z.number(),
  escrow_address: z.string(),
  chain_id: z.number(),
  job_type: z.string(),
  status: z.string(),
  reward_amount: z.number(),
  reward_token: z.string(),
  created_at: z.string(),
  expires_at: z.string(),
  url: z.string(),
});

const MyJobsSchema = z.object({
  page: z.number(),
  page_size: z.number(),
  total_pages: z.number(),
  total_results: z.number(),
  results: z.array(JobsSchema),
});

export type MyJobs = z.infer<typeof MyJobsSchema>;

export function useGetMyJobsData() {
  const {
    fields: { sorting, pagination },
  } = useTableQuery();

  return useQuery<MyJobs>({
    queryKey: ['MyJobs', [sorting, pagination]],
    queryFn: getJobsTableData,
  });
}
