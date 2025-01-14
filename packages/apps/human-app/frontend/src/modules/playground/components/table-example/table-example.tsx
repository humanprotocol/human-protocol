import { TableQueryContextProvider } from '@/shared/components/ui/table/table-query-context';
import { Table } from '@/modules/playground/components/table-example/table';

export function TableExample() {
  return (
    <TableQueryContextProvider>
      <Table />
    </TableQueryContextProvider>
  );
}
