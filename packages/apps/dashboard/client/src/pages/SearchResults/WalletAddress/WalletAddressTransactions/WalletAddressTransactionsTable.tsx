import SimpleBar from 'simplebar-react';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { TransactionsTableHead } from '@pages/SearchResults/WalletAddress/WalletAddressTransactions/tableComponents/TransactionsTableHead';
import { TransactionsTableBody } from '@pages/SearchResults/WalletAddress/WalletAddressTransactions/tableComponents/TransactionsTableBody';
import SectionWrapper from '@components/SectionWrapper';

import { useTransactionDetailsDto } from '@utils/hooks/use-transactions-details-dto';
import { useTransactionDetails } from '@services/api/use-transaction-details';

export const WalletAddressTransactionsTable = () => {
  const { data } = useTransactionDetails();
  const {
    pagination: { page, pageSize, lastPageIndex },
    setPageSize,
    setNextPage,
    setPrevPage,
  } = useTransactionDetailsDto();

  return (
    <SectionWrapper>
      <Typography variant="h5" component="p" mb={2}>
        Transactions
      </Typography>
      <TableContainer>
        <SimpleBar>
          <Table
            sx={{
              minWidth: 800,
              '& .MuiTableCell-root': {
                borderBottom: 'none',
              },
            }}
            aria-label="simple-table"
          >
            <TransactionsTableHead />
            <TransactionsTableBody />
            <TableFooter>
              <TableRow>
                <TablePagination
                  // count is unknown but required as props
                  count={9999}
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
                          (page === lastPageIndex ||
                            lastPageIndex - 1 === page),
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
        </SimpleBar>
      </TableContainer>
    </SectionWrapper>
  );
};
