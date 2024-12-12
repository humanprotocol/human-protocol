import React, { useEffect, useState } from 'react';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import MuiTableBody from '@mui/material/TableBody';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import AbbreviateClipboard from '@components/SearchResults/AbbreviateClipboard';
import { colorPalette } from '@assets/styles/color-palette';

import { TransactionTableCellMethod } from '@pages/SearchResults/WalletAddress/WalletAddressTransactions/cells/TransactionTableCellMethod';
import { TransactionTableCellValue } from '@pages/SearchResults/WalletAddress/WalletAddressTransactions/cells/TransactionTableCellValue';
import { useTransactionDetails } from '@services/api/use-transaction-details';
import { TransactionsTableBodyContainer } from '@pages/SearchResults/WalletAddress/WalletAddressTransactions/tableComponents/TransactionsTableBodyContainer';
import { handleErrorMessage } from '@services/handle-error-message';
import { useWalletSearch } from '@utils/hooks/use-wallet-search';
import { useTransactionDetailsDto } from '@utils/hooks/use-transactions-details-dto';

export const TransactionsTableBody: React.FC = () => {
  const { data, isPending, isError, error } = useTransactionDetails();
  const { filterParams } = useWalletSearch();
  const {
    setLastPageIndex,
    setPrevPage,
    pagination: { page },
  } = useTransactionDetailsDto();

  useEffect(() => {
    if (data?.results.length === 0) {
      setLastPageIndex(page);
      setPrevPage();
    }
  }, [data?.results, page, setLastPageIndex, setPrevPage]);

  useEffect(() => {
    setLastPageIndex(undefined);
  }, [filterParams.address, filterParams.chainId, setLastPageIndex]);

  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const toggleRow = (idx: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  if (isPending) {
    return (
      <TransactionsTableBodyContainer>
        <CircularProgress />
      </TransactionsTableBodyContainer>
    );
  }

  if (isError) {
    return (
      <TransactionsTableBodyContainer>
        <div>{handleErrorMessage(error)}</div>
      </TransactionsTableBodyContainer>
    );
  }

  if (!data.results.length) {
    return (
      <TransactionsTableBodyContainer>
        <div>No data</div>
      </TransactionsTableBodyContainer>
    );
  }

  return (
    <MuiTableBody sx={{ tableLayout: 'fixed' }}>
      {data.results.map((elem, idx) => (
        <>
          <TableRow
            key={idx}
            sx={{
              backgroundColor: expandedRows[idx]
                ? colorPalette.info.main
                : 'inherit',
            }}
          >
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={() => toggleRow(idx)} size="small">
                  {expandedRows[idx] ? (
                    <RemoveIcon fontSize="small" />
                  ) : (
                    <AddIcon fontSize="small" />
                  )}
                </IconButton>
                <AbbreviateClipboard value={elem.txHash} />
              </Box>
            </TableCell>
            <TableCell>
              <TransactionTableCellMethod method={elem.method} />
            </TableCell>
            <TableCell>
              <AbbreviateClipboard value={elem.from} />
            </TableCell>
            <TableCell>
              <AbbreviateClipboard value={elem.to} />
            </TableCell>
            <TableCell>{elem.block}</TableCell>
            <TableCell>
              <TransactionTableCellValue value={elem.value} />
            </TableCell>
          </TableRow>
          {elem.internalTransactions?.map((internalTx, internalIdx) => (
            <TableRow
              key={`${idx}-${internalIdx}`}
              sx={{
                backgroundColor: colorPalette.info.light,
                display: expandedRows[idx] ? 'table-row' : 'none',
                transition: 'all 1s ease',
              }}
            >
              <TableCell></TableCell>
              <TableCell>
                <TransactionTableCellMethod method={internalTx.method} />
              </TableCell>
              <TableCell>
                <AbbreviateClipboard value={internalTx.from} />
              </TableCell>
              <TableCell>
                <AbbreviateClipboard value={internalTx.to} />
              </TableCell>
              <TableCell></TableCell>
              <TableCell>
                <TransactionTableCellValue value={internalTx.value} />
              </TableCell>
            </TableRow>
          ))}
        </>
      ))}
    </MuiTableBody>
  );
};
