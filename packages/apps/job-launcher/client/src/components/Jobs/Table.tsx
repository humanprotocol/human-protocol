import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../state';

interface Data {
  address: string;
  network: string;
  balance: number;
  status: string;
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

type Order = 'asc' | 'desc';

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key
): (
  a: { [key in Key]: number | string },
  b: { [key in Key]: number | string }
) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// Since 2020 all major browsers ensure sort stability with Array.prototype.sort().
// stableSort() brings sort stability to non-modern browsers (notably IE11). If you
// only support modern browsers you can replace stableSort(exampleArray, exampleComparator)
// with exampleArray.slice().sort(exampleComparator)
function stableSort<T>(
  array: readonly T[],
  comparator: (a: T, b: T) => number
) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

interface HeadCell {
  id: keyof Data;
  label: string;
  sortable: boolean;
}

const headCells: readonly HeadCell[] = [
  {
    id: 'address',
    label: 'Address',
    sortable: true,
  },
  {
    id: 'network',
    label: 'Network',
    sortable: true,
  },
  {
    id: 'balance',
    label: 'Balance',
    sortable: true,
  },
  {
    id: 'status',
    label: 'Status',
    sortable: false,
  },
];

interface EnhancedTableProps {
  onRequestSort: (
    event: React.MouseEvent<unknown>,
    property: keyof Data
  ) => void;
  order: Order;
  orderBy: string;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler =
    (property: keyof Data) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align="left"
            sortDirection={orderBy === headCell.id ? order : false}
          >
            {headCell.sortable ? (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
              </TableSortLabel>
            ) : (
              headCell.label
            )}
          </TableCell>
        ))}
        <TableCell align="right"></TableCell>
      </TableRow>
    </TableHead>
  );
}

export const JobsTable = () => {
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Data>('address');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();
  const { data } = useAppSelector((state) => state.jobs);

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof Data
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;

  const visibleRows = useMemo(
    () =>
      stableSort(data, getComparator(order, orderBy)).slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      ),
    [order, orderBy, page, rowsPerPage]
  );

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
        <Table
          sx={{
            minWidth: 750,
            th: { borderWidth: '2px', borderColor: '#320A8D', fontWeight: 500 },
            td: { borderColor: '#cacfe8' },
          }}
        >
          <EnhancedTableHead
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
          />
          {data.length > 0 ? (
            <TableBody>
              {visibleRows.map((row, i) => (
                <TableRow
                  key={i}
                  hover
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    cursor: 'pointer',
                  }}
                >
                  <TableCell align="left" sx={{ fontWeight: 600 }}>
                    {row.address}
                  </TableCell>
                  <TableCell align="left">{row.network}</TableCell>
                  <TableCell align="left" sx={{ fontWeight: 600 }}>
                    {row.balance} HMT
                  </TableCell>
                  <TableCell align="left" sx={{ fontWeight: 600 }}>
                    {row.status}
                  </TableCell>
                  <TableCell align="right">
                    <Link
                      style={{ fontWeight: 600, textDecoration: 'underline' }}
                      to="/jobs/details/1"
                    >
                      Details
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          ) : (
            <TableBody>
              <TableRow style={{ height: 53 * 10 }}>
                <TableCell align="center" colSpan={5}>
                  <Typography variant="h5">
                    There are no Jobs at the moment, click the button
                    <br /> below to create a new Job
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    sx={{ mt: 3 }}
                    onClick={() => navigate('/jobs/create')}
                  >
                    + Create a Job
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          )}
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};
