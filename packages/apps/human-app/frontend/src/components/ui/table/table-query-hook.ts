import { useContext } from 'react';
import { TableQueryContext } from '@/components/ui/table/table-query-context';

export const useTableQuery = () => useContext(TableQueryContext);
