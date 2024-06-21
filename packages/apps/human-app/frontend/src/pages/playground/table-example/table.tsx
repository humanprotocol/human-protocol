import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { useQuery } from '@tanstack/react-query';
import { TableHeaderCell } from '@/components/ui/table/table-header-cell';
import { useTableQuery } from '@/components/ui/table/table-query-hook';
import type { Person } from '@/pages/playground/table-example/table-service';
import { getTableData } from '@/pages/playground/table-example/table-service';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { Sorting } from '@/components/ui/table/table-header-menu.tsx/sorting';
import { Filtering } from '@/components/ui/table/table-header-menu.tsx/filtering';

const columns: MRT_ColumnDef<Person>[] = [
  {
    accessorKey: 'name.firstName',
    header: 'First Name',
    size: 150,
    enableSorting: true,
  },
  {
    accessorKey: 'name.lastName',
    header: 'Last Name',
    size: 150,
    muiTableHeadCellProps: () => ({
      component: (props) => (
        <TableHeaderCell
          {...props}
          popoverContent={
            <Sorting
              clear={() => undefined}
              sortingOptions={[
                { label: 'test1', sortCallback: () => undefined },
                { label: 'test2', sortCallback: () => undefined },
              ]}
            />
          }
        />
      ),
    }),
  },
  {
    accessorKey: 'address',
    header: 'Address',
    size: 200,
    muiTableHeadCellProps: () => ({
      component: (props) => (
        <TableHeaderCell
          {...props}
          popoverContent={
            <Filtering
              clear={() => undefined}
              filteringOptions={[{ name: 'test', option: 'test' }]}
              isChecked={(option) => option === 'test'}
              setFiltering={() => undefined}
            />
          }
        />
      ),
    }),
  },
  {
    accessorKey: 'city',
    header: 'City',
    size: 150,
  },
  {
    accessorKey: 'state',
    header: 'State',
    size: 150,
  },
];

export function Table() {
  const {
    fields: { sorting, pagination },
  } = useTableQuery();

  const { data, isLoading, isError, isRefetching } = useQuery<Person[]>({
    queryKey: ['example', [sorting, pagination]],
    queryFn: () => getTableData(),
  });

  const table = useMaterialReactTable({
    columns,
    data: !data ? [] : data,
    state: {
      isLoading,
      showAlertBanner: isError,
      showProgressBars: isRefetching,
    },
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
    renderTopToolbar: () => (
      <SearchForm
        columnId="address"
        label="Example address search"
        name="Example address search"
        placeholder="Example address search"
      />
    ),
  });

  return <MaterialReactTable table={table} />;
}
