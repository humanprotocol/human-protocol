import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { httpService } from '../http-service';
import { apiPaths } from '../api-paths';
import { useWalletSearch } from '@utils/hooks/use-wallet-search';
import { useTransactionDetailsDto } from '@utils/hooks/use-transactions-details-dto';
import { validateResponse } from '@services/validate-response';

const transactionDetailsSuccessResponseSchema = z.object({
  block: z.number(),
  from: z.string(),
  to: z.string(),
  value: z.string(),
  method: z.string(),
  txHash: z.string(),
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

export function useTransactionDetails() {
  const { filterParams } = useWalletSearch();
  const {
    params,
    pagination: { lastPageIndex, page },
    setLastPageIndex,
  } = useTransactionDetailsDto();

  const dto: PaginatedTransactionDetailsDto = {
    chainId: filterParams.chainId,
    skip: params.skip,
    first: params.first,
  };

  return useQuery({
    queryFn: async () => {
      const { data } = await httpService.get(
        `${apiPaths.transactionDetails.path}/${filterParams.address}`,
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
          `${apiPaths.transactionDetails.path}/${filterParams.address}`,
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
    queryKey: ['useTransactionDetails', filterParams.address, dto],
  });
}
