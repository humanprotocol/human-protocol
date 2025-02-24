import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { httpService } from '../http-service';
import { apiPaths } from '../api-paths';
import { useWalletSearch } from '@utils/hooks/use-wallet-search';
import { validateResponse } from '@services/validate-response';
import { useEscrowDetailsDto } from '@utils/hooks/use-escrows-details-dto';
import { AddressDetailsOperator } from '@services/api/use-address-details';

const escrowDetailsSuccessResponseSchema = z.object({
  chainId: z.number(),
  address: z.string(),
  status: z.string(),
});

export type TransactionDetails = z.infer<
  typeof escrowDetailsSuccessResponseSchema
>;

const paginatedEscrowsDetailsSuccessResponseSchema = z.object({
  address: z.string(),
  chainId: z.number(),
  first: z.number(),
  skip: z.number(),
  results: z.array(escrowDetailsSuccessResponseSchema),
});

export type PaginatedEscrowDetails = z.infer<
  typeof paginatedEscrowsDetailsSuccessResponseSchema
>;

export interface PaginatedEscrowsDetailsDto {
  skip: number;
  first: number;
  chainId: number;
  role: AddressDetailsOperator['role'];
}

export function useEscrowDetails({
  role,
}: {
  role: AddressDetailsOperator['role'];
}) {
  const { filterParams } = useWalletSearch();
  const {
    setLastPageIndex,
    pagination: { page, lastPageIndex },
    params,
  } = useEscrowDetailsDto();

  const dto: PaginatedEscrowsDetailsDto = {
    chainId: filterParams.chainId,
    skip: params.skip,
    first: params.first,
    role,
  };

  return useQuery({
    queryFn: async () => {
      const { data } = await httpService.get(
        `${apiPaths.escrowDetails.path}/${filterParams.address}`,
        {
          params: dto,
        }
      );

      const validResponse = validateResponse(
        data,
        paginatedEscrowsDetailsSuccessResponseSchema
      );

      // check if last page
      if (lastPageIndex === undefined) {
        const { data: lastPageCheckData } = await httpService.get(
          `${apiPaths.escrowDetails.path}/${filterParams.address}`,
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
          paginatedEscrowsDetailsSuccessResponseSchema
        );

        if (validLastPageCheckData.results.length === 0) {
          setLastPageIndex(page + 1);
        }
      }

      return validResponse;
    },
    queryKey: ['useEscrowDetails', filterParams.address, dto],
  });
}
