import { useCallback, useState } from 'react';

type PaginationState = {
  params: {
    first: number;
    skip: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    lastPageIndex?: number;
  };
  setNextPage: () => void;
  setPrevPage: () => void;
  setPageSize: (pageSize: number) => void;
  setLastPageIndex: (lastPageIndex: number | undefined) => void;
};

const INITIAL_PAGE_SIZE = 10;

const usePagination = (): PaginationState => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(INITIAL_PAGE_SIZE);
  const [lastPageIndex, setLastPageIndex] = useState<number | undefined>();

  const skip = page * pageSize;

  const setNextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const setPrevPage = useCallback(() => {
    setPage((prev) => Math.max(0, prev - 1));
  }, []);

  const handleSetPageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(0);
    setLastPageIndex(undefined);
  }, []);

  const handleSetLastPageIndex = useCallback(
    (newLastPageIndex: number | undefined) => {
      setLastPageIndex(newLastPageIndex);
    },
    []
  );

  return {
    params: {
      first: pageSize,
      skip,
    },
    pagination: {
      page,
      pageSize,
      lastPageIndex,
    },
    setNextPage,
    setPrevPage,
    setPageSize: handleSetPageSize,
    setLastPageIndex: handleSetLastPageIndex,
  };
};

export default usePagination;
