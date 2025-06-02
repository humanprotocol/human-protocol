import { useEffect } from 'react';

import SimpleBar from 'simplebar-react';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { TransactionsTableHead } from '@/pages/SearchResults/WalletAddress/WalletAddressTransactions/tableComponents/TransactionsTableHead';
import { TransactionsTableBody } from '@/pages/SearchResults/WalletAddress/WalletAddressTransactions/tableComponents/TransactionsTableBody';
import SectionWrapper from '@/components/SectionWrapper';

import { useTransactionDetailsDto } from '@/utils/hooks/use-transactions-details-dto';
import { useTransactionDetails } from '@/services/api/use-transaction-details';

export const WalletAddressTransactionsTable = () => {
  const { data } = useTransactionDetails();
  const {
    pagination: { page, pageSize, lastPageIndex },
    setPageSize,
    setNextPage,
    setPrevPage,
  } = useTransactionDetailsDto();

  useEffect(() => {
    return () => {
      setPageSize(10);
    };
  }, [setPageSize]);

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
            <TransactionsTableBody />
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
                // count is unknown but required as props
                count={Number.MAX_SAFE_INTEGER}
                // onPageChange is required as props
                onPageChange={() => {}}
                page={page}
                component="td"
                rowsPerPage={pageSize}
                onRowsPerPageChange={(event) => {
                  setPageSize(Number(event.target.value));
                }}
                rowsPerPageOptions={[5, 10]}
                labelDisplayedRows={({ from, to }) => {
                  const effectiveTo = data?.results
                    ? from + data.results.length - 1
                    : to;
                  return `${from}–${effectiveTo}`;
                }}
                slotProps={{
                  actions: {
                    nextButton: {
                      onClick: () => {
                        setNextPage();
                      },
                      disabled:
                        lastPageIndex !== undefined &&
                        (page === lastPageIndex || lastPageIndex - 1 === page),
                    },
                    previousButton: {
                      onClick: () => {
                        setPrevPage();
                      },
                    },
                  },
                }}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </SectionWrapper>
  );
};
