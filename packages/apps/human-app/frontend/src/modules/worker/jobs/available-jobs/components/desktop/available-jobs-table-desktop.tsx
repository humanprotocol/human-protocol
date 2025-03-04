import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { t } from 'i18next';
import { useEffect, useMemo } from 'react';
import { createTableDarkMode } from '@/shared/styles/create-table-dark-mode';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useJobsFilterStore } from '../../../hooks';
import { EscrowAddressSearchForm } from '../../../components';
import { useGetAvailableJobsData } from '../../hooks/use-get-available-jobs-data';
import { useGetAvailableJobsColumns } from '../../hooks';
import { useAvailableJobsPagination } from '../../hooks/use-available-jobs-pagination';

interface AvailableJobsTableProps {
  chainIdsEnabled: number[];
}

export function AvailableJobsTableDesktop({
  chainIdsEnabled,
}: Readonly<AvailableJobsTableProps>) {
  const { colorPalette, isDarkMode } = useColorMode();
  const { data: tableData, status: tableStatus } = useGetAvailableJobsData();
  const {
    setSearchEscrowAddress,
    setPageParams,
    filterParams,
    resetFilterParams,
  } = useJobsFilterStore();
  const { paginationState, setPaginationState } = useAvailableJobsPagination({
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
