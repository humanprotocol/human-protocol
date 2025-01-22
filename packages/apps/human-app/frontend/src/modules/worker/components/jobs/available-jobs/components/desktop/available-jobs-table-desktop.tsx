import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { t } from 'i18next';
import { useEffect, useMemo } from 'react';
import { useJobsFilterStore } from '@/modules/worker/hooks/use-jobs-filter-store';
import { usePagination } from '@/modules/worker/hooks/use-pagination';
import { useGetAvailableJobsData } from '@/modules/worker/services/available-jobs-data';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { createTableDarkMode } from '@/shared/styles/create-table-dark-mode';
import { EscrowAddressSearchForm } from '@/modules/worker/components/jobs/escrow-address-search-form';
import { useGetAvailableJobsColumns } from '@/modules/worker/components/jobs/available-jobs/hooks/use-get-available-jobs-columns';

interface AvailableJobsTableProps {
  chainIdsEnabled: number[];
}

export function AvailableJobsTableDesktop({
  chainIdsEnabled,
}: AvailableJobsTableProps) {
  const { colorPalette, isDarkMode } = useColorMode();
  const { data: tableData, status: tableStatus } = useGetAvailableJobsData();
  const {
    setSearchEscrowAddress,
    setPageParams,
    filterParams,
    resetFilterParams,
  } = useJobsFilterStore();
  const { paginationState, setPaginationState } = usePagination({
    setPageParams,
    filterParams,
  });
  const columns = useGetAvailableJobsColumns(chainIdsEnabled);

  const memoizedTableDataResults = useMemo(
    () => tableData?.results ?? [],
    [tableData?.results]
  );

  useEffect(() => {
    return () => {
      resetFilterParams();
    };
  }, [resetFilterParams]);

  const table = useMaterialReactTable({
    columns,
    data: memoizedTableDataResults,
    state: {
      isLoading: tableStatus === 'pending',
      showAlertBanner: tableStatus === 'error',
      pagination: paginationState,
    },
    enablePagination: Boolean(tableData?.total_pages),
    manualPagination: true,
    onPaginationChange: setPaginationState,
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
    enableSorting: true,
    manualSorting: true,
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
