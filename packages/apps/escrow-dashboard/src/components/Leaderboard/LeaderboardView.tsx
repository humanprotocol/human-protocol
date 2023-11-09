import { ChainId, NETWORKS } from '@human-protocol/sdk';
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
} from '@mui/material';
import { FC, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { CardContainer } from '../Cards';
import { ViewTitle } from '../ViewTitle';
import userSvg from 'src/assets/user.svg';
import { AppState } from 'src/state';
import { useLeadersData, useLeadersByChainID } from 'src/state/leader/hooks';
import { shortenAddress } from 'src/utils';

type LeaderboardViewProps = {
  showAll?: boolean;
};

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  const aVal = a[orderBy] ?? '';
  const bVal = b[orderBy] ?? '';

  if (bVal < aVal) {
    return -1;
  }
  if (bVal > aVal) {
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

function stableSort<T>(
  array: readonly T[],
  comparator: (a: T, b: T) => number
) {
  const stabilizedThis = array?.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

export const LeaderboardView: FC<LeaderboardViewProps> = ({
  showAll = true,
}) => {
  const { leadersLoaded } = useSelector((state: AppState) => state.leader);

  useLeadersData();

  const leaders = useLeadersByChainID();

  const navigate = useNavigate();

  const handleClickLeader = (chainId: ChainId, address: string) => {
    navigate(`/leader/${chainId}/${address}`);
  };

  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<string | undefined>();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleRequestSort = (property: string) => {
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
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - leaders?.length) : 0;

  const visibleRows = useMemo(() => {
    if (!orderBy) {
      return leaders?.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      );
    }
    return stableSort(leaders, getComparator(order, orderBy)).slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [leaders, order, orderBy, page, rowsPerPage]);

  return (
    <Box mt={13}>
      <Box display="flex" alignItems="center" flexWrap="wrap">
        <ViewTitle title="Leaderboard" iconUrl={userSvg} />
        {!showAll && (
          <Button
            variant="outlined"
            sx={{ ml: { xs: 'auto', sm: 3 }, mr: { xs: 'auto', sm: 0 } }}
            href="/leaderboard"
          >
            See More
          </Button>
        )}
      </Box>
      <Box mt={{ xs: 4, md: 8 }}>
        <CardContainer sxProps={{ padding: '42px 52px 28px' }}>
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table
              sx={{
                minWidth: 650,
                th: {
                  fontSize: '12px',
                  border: 'none',
                  background: '#F6F5FC',
                  textTransform: 'uppercase',
                  ':first-child': { borderBottomLeftRadius: '4px' },
                  ':last-child': { borderBottomRightRadius: '4px' },
                },
                td: { border: 'none' },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell sortDirection={orderBy === 'role' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'role'}
                      direction={orderBy === 'role' ? order : 'asc'}
                      onClick={() => handleRequestSort('role')}
                    >
                      <Box display="flex" alignItems="center" gap="10px">
                        Operator
                        <Chip label="on HUMAN Protocol" size="small" />
                      </Box>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    sortDirection={orderBy === 'address' ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === 'address'}
                      direction={orderBy === 'address' ? order : 'asc'}
                      onClick={() => handleRequestSort('address')}
                    >
                      Address
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    sortDirection={orderBy === 'amountStaked' ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === 'amountStaked'}
                      direction={orderBy === 'amountStaked' ? order : 'asc'}
                      onClick={() => handleRequestSort('amountStaked')}
                    >
                      Stake
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <FormControl sx={{ minWidth: 210 }} size="small">
                      <InputLabel id="demo-select-small-label">
                        By Network
                      </InputLabel>
                      <Select
                        labelId="demo-select-small-label"
                        id="demo-select-small"
                        label="By Network"
                      >
                        <MenuItem value={10}>Ten</MenuItem>
                        <MenuItem value={20}>Twenty</MenuItem>
                        <MenuItem value={30}>Thirty</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell
                    sortDirection={orderBy === 'reputation' ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === 'reputation'}
                      direction={orderBy === 'reputation' ? order : 'asc'}
                      onClick={() => handleRequestSort('reputation')}
                    >
                      Reputation Score
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Operator Fee</TableCell>
                </TableRow>
              </TableHead>
              {!leadersLoaded ? (
                <TableBody>
                  <TableRow style={{ height: 53 * 5 }}>
                    <TableCell align="center" colSpan={7}>
                      Loading...
                    </TableCell>
                  </TableRow>
                </TableBody>
              ) : leaders?.length > 0 ? (
                <TableBody>
                  {visibleRows.map((staker, i) => (
                    <TableRow
                      key={`${staker.chainId}-${staker.address}`}
                      sx={{ cursor: 'pointer' }}
                      onClick={() =>
                        handleClickLeader(staker.chainId, staker.address)
                      }
                    >
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{staker.role}</TableCell>
                      <TableCell>{shortenAddress(staker.address)}</TableCell>
                      <TableCell>{staker.amountStaked} HMT</TableCell>
                      <TableCell>{NETWORKS[staker.chainId]?.title}</TableCell>
                      <TableCell>{staker.reputation}</TableCell>
                      <TableCell>0 HMT</TableCell>
                    </TableRow>
                  ))}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={7} />
                    </TableRow>
                  )}
                </TableBody>
              ) : (
                <TableBody>
                  <TableRow style={{ height: 53 * 5 }}>
                    <TableCell align="center" colSpan={7}>
                      No data available yet
                    </TableCell>
                  </TableRow>
                </TableBody>
              )}
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={leaders?.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContainer>
      </Box>
    </Box>
  );
};
