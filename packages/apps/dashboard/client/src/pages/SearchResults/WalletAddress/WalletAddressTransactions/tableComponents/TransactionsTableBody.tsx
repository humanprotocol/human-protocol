import React, { useEffect, useState } from 'react';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import MuiTableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import AbbreviateClipboard from '@/components/SearchResults/AbbreviateClipboard';
import { TransactionTableCellMethod } from '@/pages/SearchResults/WalletAddress/WalletAddressTransactions/cells/TransactionTableCellMethod';
import { TransactionTableCellValue } from '@/pages/SearchResults/WalletAddress/WalletAddressTransactions/cells/TransactionTableCellValue';
import { TransactionsTableBodyContainer } from '@/pages/SearchResults/WalletAddress/WalletAddressTransactions/tableComponents/TransactionsTableBodyContainer';
import { useTransactionDetails } from '@/services/api/use-transaction-details';
import { handleErrorMessage } from '@/services/handle-error-message';
import { useTransactionDetailsDto } from '@/utils/hooks/use-transactions-details-dto';
import { useWalletSearch } from '@/utils/hooks/use-wallet-search';

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
                ? 'table.selected'
                : 'table.main',
            }}
          >
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box width={30}>
                  {elem.internalTransactions.length > 0 && (
                    <IconButton onClick={() => toggleRow(idx)} size="small">
                      {expandedRows[idx] ? (
                        <RemoveCircleIcon fontSize="medium" />
                      ) : (
                        <AddCircleIcon fontSize="medium" />
                      )}
                    </IconButton>
                  )}
                </Box>
                <AbbreviateClipboard value={elem.txHash} />
              </Box>
            </TableCell>
            <TableCell>
              <TransactionTableCellMethod method={elem.method} />
            </TableCell>
            <TableCell>
              <AbbreviateClipboard
                value={elem.from}
                link={`/search/${data.chainId}/${elem.from}`}
              />
            </TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ArrowForwardIcon sx={{ color: 'text.primary' }} />
                <AbbreviateClipboard
                  value={elem.receiver || elem.to}
                  link={`/search/${data.chainId}/${elem.receiver || elem.to}`}
                />
              </Box>
            </TableCell>
            <TableCell>{elem.block}</TableCell>
            <TableCell>
              <TransactionTableCellValue
                value={elem.value}
                method={elem.method}
              />
            </TableCell>
          </TableRow>
          {elem.internalTransactions?.map((internalTx, internalIdx) => (
            <TableRow
              key={`${idx}-${internalIdx}`}
              sx={{
                bgcolor: 'table.secondary',
                display: expandedRows[idx] ? 'table-row' : 'none',
                transition: 'all 1s ease',
              }}
            >
              <TableCell></TableCell>
              <TableCell>
                <TransactionTableCellMethod method={internalTx.method} />
              </TableCell>
              <TableCell>
                <AbbreviateClipboard
                  value={internalTx.from}
                  link={`/search/${data.chainId}/${internalTx.from}`}
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArrowForwardIcon sx={{ color: 'text.primary' }} />
                  <AbbreviateClipboard
                    value={elem.receiver || elem.to}
                    link={`/search/${data.chainId}/${elem.receiver || elem.to}`}
                  />
                </Box>
              </TableCell>
              <TableCell></TableCell>
              <TableCell>
                <TransactionTableCellValue
                  value={internalTx.value}
                  method={internalTx.method}
                />
              </TableCell>
            </TableRow>
          ))}
        </>
      ))}
    </MuiTableBody>
  );
};
