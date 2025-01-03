import { useContext } from 'react';
import { TableQueryContext } from '@/shared/components/ui/table/table-query-context';

export const useTableQuery = () => useContext(TableQueryContext);
