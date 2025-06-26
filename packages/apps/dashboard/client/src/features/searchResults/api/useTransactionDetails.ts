import { useQuery } from '@tanstack/react-query';

import apiPaths from '@/shared/api/apiPaths';
import httpClient from '@/shared/api/httpClient';
import validateResponse from '@/shared/lib/validateResponse';

import { paginatedTransactionDetailsSchema } from '../model/transactionDetailsSchema';

type Props = {
  chainId: number;
  address: string;
  page: number;
  lastPageIndex: number | undefined;
  setLastPageIndex: (lastPageIndex: number | undefined) => void;
  params: {
    skip: number;
    first: number;
  };
};

const useTransactionDetails = ({
  chainId,
  address,
  page,
  lastPageIndex,
  setLastPageIndex,
  params,
}: Props) => {
  const dto = {
    chainId,
    skip: params.skip,
    first: params.first,
  };

  return useQuery({
    queryFn: async () => {
      const { data } = await httpClient.get(
        `${apiPaths.transactionDetails.path}/${address}`,
        {
          params: dto,
        }
      );

      const validResponse = validateResponse(
        data,
        paginatedTransactionDetailsSchema
      );

      // check if last page
      if (lastPageIndex === undefined) {
        const { data: lastPageCheckData } = await httpClient.get(
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
          paginatedTransactionDetailsSchema
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
};

export default useTransactionDetails;
