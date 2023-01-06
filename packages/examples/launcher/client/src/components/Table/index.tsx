import {
  Box,
  TableContainer,
  Table as MuiTable,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Paper,
} from '@mui/material';
import React from 'react';

type IColumn = {
  title: string;
  dataIndex: string;
  render?: (row: any) => void;
};

export interface IProps {
  columns: IColumn[];
  data?: any[];
  onRow?: (row: any) => void;
}

export function Table({ columns, data, onRow }: IProps) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <Box pb={4}>
      <TableContainer
        component={Paper}
        sx={{ backgroundColor: 'transparent', mt: 2 }}
      >
        <MuiTable>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.dataIndex}>{column.title}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {!data || data.length === 0 ? (
              <TableRow>
                <TableCell>No Data</TableCell>
              </TableRow>
            ) : (
              data
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row: any) => (
                  <TableRow
                    hover
                    key={row.id}
                    sx={{
                      cursor: 'pointer',
                      '&:last-child td, &:last-child th': { border: 0 },
                    }}
                    onClick={() => {
                      onRow?.(row);
                    }}
                  >
                    {columns.map((column) => (
                      <TableCell
                        sx={{ whiteSpace: 'nowrap', overflow: 'hidden' }}
                        key={column.dataIndex}
                      >
                        {column.render
                          ? column.render(row)
                          : row[column.dataIndex]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
            )}
          </TableBody>
        </MuiTable>
      </TableContainer>
      {Array.isArray(data) && data.length > rowsPerPage && (
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Box>
  );
}
