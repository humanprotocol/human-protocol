import { useState, useEffect } from 'react';
import type { PageSize } from '@/shared/types/entity.type';
import { type JobsFilterStoreProps } from '../../hooks';

interface PaginationProps {
  setPageParams: (pageIndex: number, pageSize: PageSize) => void;
  filterParams: JobsFilterStoreProps['filterParams'];
}

export const useAvailableJobsPagination = ({
  setPageParams,
  filterParams,
}: PaginationProps) => {
  const [paginationState, setPaginationState] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  useEffect(() => {
    if (!(paginationState.pageSize === 5 || paginationState.pageSize === 10))
      return;
    setPageParams(paginationState.pageIndex, paginationState.pageSize);
  }, [paginationState, setPageParams]);

  useEffect(() => {
    setPaginationState({
      pageIndex: filterParams.page,
      pageSize: filterParams.page_size,
    });
  }, [filterParams.page, filterParams.page_size]);

  return { paginationState, setPaginationState };
};
