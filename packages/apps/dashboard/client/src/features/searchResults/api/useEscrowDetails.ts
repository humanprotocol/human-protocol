import { useQuery } from '@tanstack/react-query';

import { apiPaths } from '@/services/api-paths';
import { httpService } from '@/services/http-service';
import { validateResponse } from '@/services/validate-response';

import { paginatedEscrowDetailsSchema } from '../model/escrowDetailsSchema';

type Props = {
  role: string | null;
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

const useEscrowDetails = ({
  role,
  chainId,
  address,
  page,
  lastPageIndex,
  setLastPageIndex,
  params,
}: Props) => {
  const dto = {
    chainId,
    role,
    skip: params.skip,
    first: params.first,
  };

  return useQuery({
    queryFn: async () => {
      const { data } = await httpService.get(
        `${apiPaths.escrowDetails.path}/${address}`,
        { params: dto }
      );

      const validResponse = validateResponse(
        data,
        paginatedEscrowDetailsSchema
      );

      // check if last page
      if (lastPageIndex === undefined) {
        const { data: lastPageCheckData } = await httpService.get(
          `${apiPaths.escrowDetails.path}/${address}`,
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
          paginatedEscrowDetailsSchema
        );

        if (validLastPageCheckData.results.length === 0) {
          setLastPageIndex(page + 1);
        }
      }

      return validResponse;
    },
    queryKey: ['useEscrowDetails', address, dto],
    enabled: !!chainId && !!address,
  });
};

export default useEscrowDetails;
