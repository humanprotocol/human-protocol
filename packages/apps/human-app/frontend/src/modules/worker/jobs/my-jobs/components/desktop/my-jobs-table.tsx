import { t } from 'i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { useColorMode } from '@/shared/contexts/color-mode';
import { createTableDarkMode } from '@/shared/styles/create-table-dark-mode';
import { EscrowAddressSearchForm } from '../../../components';
import { useGetMyJobsData, useMyJobsFilterStore } from '../../../hooks';
import { useRefreshJobsMutation } from '../../hooks';
import { getColumnsDefinition } from './columns';

interface MyJobsTableProps {
  chainIdsEnabled: number[];
}

export function MyJobsTable({ chainIdsEnabled }: Readonly<MyJobsTableProps>) {
  const { colorPalette, isDarkMode } = useColorMode();
  const {
    setSearchEscrowAddress,
    setPageParams,
    filterParams,
    resetFilterParams,
  } = useMyJobsFilterStore();
  const { data: tableData, status: tableStatus } = useGetMyJobsData();

  const memoizedTableDataResults = useMemo(
    () => tableData?.results ?? [],
    [tableData?.results]
  );

  const { mutate: refreshTasksMutation, isPending: isRefreshTasksPending } =
    useRefreshJobsMutation();
  const { address: oracle_address } = useParams<{ address: string }>();

  const [paginationState, setPaginationState] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  const refreshData = useCallback(() => {
    refreshTasksMutation({ oracle_address: oracle_address ?? '' });
  }, [refreshTasksMutation, oracle_address]);

  useEffect(() => {
    if (paginationState.pageSize === 5 || paginationState.pageSize === 10) {
      setPageParams(paginationState.pageIndex, paginationState.pageSize);
    }
  }, [paginationState, setPageParams]);

  useEffect(() => {
    setPaginationState({
      pageIndex: filterParams.page,
      pageSize: filterParams.page_size,
    });
  }, [filterParams.page, filterParams.page_size]);

  useEffect(() => {
    return () => {
      resetFilterParams();
    };
  }, [resetFilterParams]);

  const table = useMaterialReactTable({
    columns: getColumnsDefinition({
      refreshData,
      isRefreshTasksPending,
      chainIdsEnabled,
    }),
    data: memoizedTableDataResults,
    state: {
      isLoading: tableStatus === 'pending',
      showAlertBanner: tableStatus === 'error',
      pagination: paginationState,
    },
    enablePagination: Boolean(tableData?.total_pages),
    manualPagination: true,
    onPaginationChange: (updater) => {
      setPaginationState(updater);
    },
    muiPaginationProps: {
      SelectProps: {
        sx: {
          '.MuiSelect-icon': {
            ':hover': {
              backgroundColor: 'blue',
            },
            fill: colorPalette.text.primary,
          },
        },
      },
      rowsPerPageOptions: [5, 10],
    },
    pageCount: tableData?.total_pages ?? -1,
    rowCount: tableData?.total_results,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
    renderTopToolbar: () => (
      <EscrowAddressSearchForm
        columnId={t('worker.jobs.escrowAddressColumnId')}
        label={t('worker.jobs.searchEscrowAddress')}
        placeholder={t('worker.jobs.searchEscrowAddress')}
        updater={(address) => {
          setSearchEscrowAddress(address);
        }}
      />
    ),
    muiTableHeadCellProps: {
      sx: {
        borderColor: colorPalette.paper.text,
      },
    },
    muiTableBodyCellProps: {
      sx: {
        borderColor: colorPalette.paper.text,
      },
    },
    muiTablePaperProps: {
      sx: {
        boxShadow: '0px 2px 2px 0px #E9EBFA80',
      },
    },
    ...(isDarkMode ? createTableDarkMode(colorPalette) : {}),
  });

  return <MaterialReactTable table={table} />;
}
