import {
  Box,
  Paper,
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
} from '@mui/material';
import { useState } from 'react';

type Order = 'asc' | 'desc';

interface TableColumn {
  id: string;
  label: string;
  sortable?: boolean;
  render?: (data: any) => void;
}

interface EnhancedTableProps {
  columns: Array<TableColumn>;
  onRequestSort: (event: React.MouseEvent<unknown>, property: string) => void;
  order: Order;
  orderBy?: string;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const { columns, order, orderBy, onRequestSort } = props;
  const createSortHandler =
    (property: string) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>
        {columns.map((column) => (
          <TableCell
            key={column.id}
            align="left"
            sortDirection={orderBy === column.id ? order : false}
          >
            {column.sortable ? (
              <TableSortLabel
                active={orderBy === column.id}
                direction={orderBy === column.id ? order : 'asc'}
                onClick={createSortHandler(column.id)}
              >
                {column.label}
              </TableSortLabel>
            ) : (
              column.label
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

export const Table = ({
  data,
  columns,
  defaultOrderBy,
  loading,
  emptyCell,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: {
  data: any;
  columns: Array<TableColumn>;
  defaultOrderBy?: string;
  loading?: boolean;
  emptyCell?: React.ReactNode;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<string | undefined>(defaultOrderBy);

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: string,
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  return (
    <Box>
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '16px',
          boxShadow:
            '0px 3px 1px -2px #E9EBFA, 0px 2px 2px rgba(233, 235, 250, 0.5), 0px 1px 5px rgba(233, 235, 250, 0.2);',
        }}
      >
        <MuiTable
          sx={{
            minWidth: 750,
            th: { borderWidth: '2px', borderColor: '#320A8D', fontWeight: 500 },
            td: { borderColor: '#cacfe8' },
          }}
        >
          <EnhancedTableHead
            columns={columns}
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
          />
          {loading ? (
            <TableBody>
              <TableRow style={{ height: 53 * 10 }}>
                <TableCell align="center" colSpan={columns.length}>
                  Loading...
                </TableCell>
              </TableRow>
            </TableBody>
          ) : data?.results?.length > 0 ? (
            <TableBody>
              {data?.results?.map((row: any, i: number) => (
                <TableRow
                  key={i}
                  hover
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    cursor: 'pointer',
                  }}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      align="left"
                      sx={{ fontWeight: 600 }}
                    >
                      {column.render ? column.render(row) : row[column.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          ) : (
            <TableBody>
              <TableRow style={{ height: 53 * 10 }}>
                <TableCell align="center" colSpan={columns.length}>
                  {emptyCell ? emptyCell : <></>}
                </TableCell>
              </TableRow>
            </TableBody>
          )}
        </MuiTable>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={data?.totalResults || data?.results.length}
        rowsPerPage={rowsPerPage}
        page={data?.page || page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </Box>
  );
};
