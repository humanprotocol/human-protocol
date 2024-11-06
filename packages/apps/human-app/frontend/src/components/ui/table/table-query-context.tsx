import React, { createContext, useState } from 'react';
import type {
  MRT_SortingState,
  MRT_PaginationState,
} from 'material-react-table';

const DEFAULT_PAGINATION = {
  pageIndex: 1,
  pageSize: 5,
};

export interface TableQueryContext {
  actions: {
    setSorting: React.Dispatch<React.SetStateAction<MRT_SortingState>>;
    setPagination: React.Dispatch<React.SetStateAction<MRT_PaginationState>>;
    setFiltering: React.Dispatch<React.SetStateAction<string[]>>;
  };
  fields: {
    sorting: MRT_SortingState;
    pagination: MRT_PaginationState;
    filtering: string[];
  };
}

export const TableQueryContext = createContext<TableQueryContext>({
  actions: {
    setSorting: () => undefined,
    setPagination: () => undefined,
    setFiltering: () => undefined,
  },
  fields: {
    sorting: [],
    pagination: DEFAULT_PAGINATION,
    filtering: [],
  },
});

export function TableQueryContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [pagination, setPagination] =
    useState<MRT_PaginationState>(DEFAULT_PAGINATION);
  const [filtering, setFiltering] = useState<string[]>([]);

  return (
    <TableQueryContext.Provider
      value={{
        actions: {
          setSorting,
          setPagination,
          setFiltering,
        },
        fields: {
          sorting,
          pagination,
          filtering,
        },
      }}
    >
      {children}
    </TableQueryContext.Provider>
  );
}
