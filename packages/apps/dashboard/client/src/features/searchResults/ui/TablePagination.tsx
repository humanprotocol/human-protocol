import { type FC, useEffect } from 'react';

import MuiTablePagination from '@mui/material/TablePagination';

import useGlobalFiltersStore from '@/shared/store/useGlobalFiltersStore';

type Props = {
  page: number;
  pageSize: number;
  resultsLength: number;
  lastPageIndex: number | undefined;
  isDataLoading: boolean | undefined;
  setPageSize: (pageSize: number) => void;
  setNextPage: () => void;
  setPrevPage: () => void;
  setLastPageIndex: (lastPageIndex: number | undefined) => void;
};

const TablePagination: FC<Props> = ({
  page,
  pageSize,
  resultsLength,
  lastPageIndex,
  isDataLoading,
  setPageSize,
  setNextPage,
  setPrevPage,
  setLastPageIndex,
}) => {
  const { chainId, address } = useGlobalFiltersStore();

  useEffect(() => {
    if (
      resultsLength !== undefined &&
      resultsLength === 0 &&
      page > 0 &&
      !isDataLoading
    ) {
      setLastPageIndex(page);
      setPrevPage();
    }
  }, [resultsLength, page, setLastPageIndex, setPrevPage, isDataLoading]);

  useEffect(() => {
    setLastPageIndex(undefined);
  }, [address, chainId, setLastPageIndex]);

  useEffect(() => {
    return () => {
      setPageSize(10);
    };
  }, [setPageSize]);

  return (
    <MuiTablePagination
      // count is unknown but required as props
      count={Number.MAX_SAFE_INTEGER}
      // onPageChange is required as props
      onPageChange={() => {}}
      page={page}
      component="td"
      rowsPerPage={pageSize}
      onRowsPerPageChange={(event) => {
        setPageSize(Number(event.target.value));
      }}
      rowsPerPageOptions={[5, 10]}
      labelDisplayedRows={({ from, to }) => {
        const effectiveTo = resultsLength ? from + resultsLength - 1 : to;
        return `${from}–${effectiveTo}`;
      }}
      slotProps={{
        actions: {
          nextButton: {
            onClick: () => {
              setNextPage();
            },
            disabled:
              lastPageIndex !== undefined &&
              (page === lastPageIndex || lastPageIndex - 1 === page),
          },
          previousButton: {
            onClick: () => {
              setPrevPage();
            },
          },
        },
      }}
    />
  );
};

export default TablePagination;
