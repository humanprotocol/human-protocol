import { useMutation } from '@tanstack/react-query';
import { ApiClientError } from '@/api/http-api-client';
import * as jobsService from '../../services/jobs.service';
import type { ReportAbuseBody } from '../../types';

interface ReportAbuseMutationOptions {
  onSuccess?: (status: number) => void;
  onError?: (status: number, message: string) => void;
}

export function useReportAbuseMutation(options?: ReportAbuseMutationOptions) {
  return useMutation({
    mutationFn: (data: ReportAbuseBody) => jobsService.reportAbuse(data),
    mutationKey: ['reportAbuse'],
    onError: (error) => {
      if (error instanceof ApiClientError) {
        options?.onError?.(error.status, error.message);
      }
    },
  });
}
