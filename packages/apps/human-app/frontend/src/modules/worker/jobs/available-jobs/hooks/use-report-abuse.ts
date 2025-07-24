import { useMutation } from '@tanstack/react-query';
import { ApiClientError } from '@/api/http-api-client';
import * as jobsService from '../../services/jobs.service';
import type { ReportAbuseBody } from '../../types';

interface ReportAbuseMutationOptions {
  onError?: (status: number) => void;
}

export function useReportAbuseMutation({
  onError,
}: ReportAbuseMutationOptions) {
  return useMutation({
    mutationFn: (data: ReportAbuseBody) => jobsService.reportAbuse(data),
    mutationKey: ['reportAbuse'],
    onError: (error) => {
      if (error instanceof ApiClientError) {
        onError?.(error.status);
      }
    },
  });
}
