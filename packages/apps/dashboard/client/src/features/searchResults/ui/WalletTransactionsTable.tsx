import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import SimpleBar from 'simplebar-react';

import useTransactionDetails from '@/features/searchResults/api/useTransactionDetails';
import usePagination from '@/features/searchResults/hooks/usePagination';
import TablePagination from '@/features/searchResults/ui/TablePagination';
import useGlobalFiltersStore from '@/shared/store/useGlobalFiltersStore';
import SectionWrapper from '@/shared/ui/SectionWrapper';

import TransactionsTableBody from './WalletTransactions/TransactionsTableBody';
import TransactionsTableHead from './WalletTransactions/TransactionsTableHead';

const WalletTransactionsTable = () => {
  const { chainId, address } = useGlobalFiltersStore();
  const {
    pagination: { page, pageSize, lastPageIndex },
    params,
    setPageSize,
    setNextPage,
    setPrevPage,
    setLastPageIndex,
  } = usePagination();
  const { data, isLoading, error } = useTransactionDetails({
    chainId,
    address,
    page,
    lastPageIndex,
    setLastPageIndex,
    params,
  });

  return (
    <SectionWrapper>
      <Typography variant="h5" mb={2}>
        Transactions
      </Typography>
      <TableContainer>
        <SimpleBar>
          <Table
            aria-label="simple-table"
            sx={{
              minWidth: 1000,
              '& .MuiTableCell-root': {
                borderBottom: 'none',
              },
            }}
          >
            <TransactionsTableHead />
            <TransactionsTableBody
              data={data}
              isLoading={isLoading}
              error={error}
            />
          </Table>
        </SimpleBar>
        <Table
          sx={{
            width: '100%',
            '& .MuiTableCell-root': {
              borderBottom: 'none',
            },
          }}
        >
          <TableFooter>
            <TableRow>
              <TablePagination
                page={page}
                pageSize={pageSize}
                resultsLength={data?.results.length ?? 0}
                lastPageIndex={lastPageIndex}
                isDataLoading={isLoading}
                setPageSize={setPageSize}
                setNextPage={setNextPage}
                setPrevPage={setPrevPage}
                setLastPageIndex={setLastPageIndex}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </SectionWrapper>
  );
};

export default WalletTransactionsTable;
