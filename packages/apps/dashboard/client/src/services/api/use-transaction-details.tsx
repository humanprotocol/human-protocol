import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { validateResponse } from '@/services/validate-response';
import { useTransactionDetailsDto } from '@/utils/hooks/use-transactions-details-dto';

import { apiPaths } from '../api-paths';
import { httpService } from '../http-service';

const internalTransactionSchema = z.object({
  from: z.string(),
  to: z.string(),
  value: z.string(),
  method: z.string(),
  receiver: z.string().nullable(),
  escrow: z.string().nullable(),
  token: z.string().nullable(),
});

const transactionDetailsSuccessResponseSchema = z.object({
  txHash: z.string(),
  method: z.string(),
  from: z.string(),
  to: z.string(),
  receiver: z.string().nullable(),
  block: z.number(),
  value: z.string(),
  internalTransactions: z.array(internalTransactionSchema),
});

export type TransactionDetails = z.infer<
  typeof transactionDetailsSuccessResponseSchema
>;

const paginatedTransactionDetailsSuccessResponseSchema = z.object({
  address: z.string(),
  chainId: z.number(),
  first: z.number(),
  skip: z.number(),
  results: z.array(transactionDetailsSuccessResponseSchema),
});

export type PaginatedTransactionDetails = z.infer<
  typeof paginatedTransactionDetailsSuccessResponseSchema
>;

export interface PaginatedTransactionDetailsDto {
  skip: number;
  first: number;
  chainId: number;
}

export function useTransactionDetails(chainId: number, address: string) {
  const {
    params,
    pagination: { lastPageIndex, page },
    setLastPageIndex,
  } = useTransactionDetailsDto();

  const dto: PaginatedTransactionDetailsDto = {
    chainId,
    skip: params.skip,
    first: params.first,
  };

  return useQuery({
    queryFn: async () => {
      const { data } = await httpService.get(
        `${apiPaths.transactionDetails.path}/${address}`,
        {
          params: dto,
        }
      );

      const validResponse = validateResponse(
        data,
        paginatedTransactionDetailsSuccessResponseSchema
      );

      // check if last page
      if (lastPageIndex === undefined) {
        const { data: lastPageCheckData } = await httpService.get(
          `${apiPaths.transactionDetails.path}/${address}`,
          {
            params: {
              ...dto,
              skip: dto.skip + validResponse.results.length,
              first: 1,
            },
          }
        );
        const validLastPageCheckData = validateResponse(
          lastPageCheckData,
          paginatedTransactionDetailsSuccessResponseSchema
        );

        if (validLastPageCheckData.results.length === 0) {
          setLastPageIndex(page + 1);
        }
      }

      return validResponse;
    },
    queryKey: ['useTransactionDetails', address, dto],
    enabled: !!chainId && !!address,
  });
}
