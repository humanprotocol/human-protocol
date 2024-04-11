import { TableQueryContextProvider } from '@/components/ui/table/table-query-context';
import { Table } from '@/pages/playground/table-example/table';

export function TableExample() {
  return (
    <TableQueryContextProvider>
      <Table />
    </TableQueryContextProvider>
  );
}
