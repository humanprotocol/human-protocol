import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import CurrencyExchangeOutlinedIcon from '@mui/icons-material/CurrencyExchangeOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import MoneyOffCsredOutlinedIcon from '@mui/icons-material/MoneyOffCsredOutlined';
import SaveAltOutlinedIcon from '@mui/icons-material/SaveAltOutlined';
import { Box, Chip, IconButton, Typography } from '@mui/material';
import copy from 'copy-to-clipboard';
import { useState } from 'react';
import CreditCardFilledIcon from '../../assets/CreditCardFilled.svg';
import { CopyLinkIcon } from '../../components/Icons/CopyLinkIcon';
import { Table } from '../../components/Table';
import { paymentSource, paymentType } from '../../constants/payment';
import { usePayments } from '../../hooks/usePayments';
import { useSnackbar } from '../../providers/SnackProvider';
import { getReceipt } from '../../services/payment';
import { CardIcon } from '../Icons/CardIcon';
import { CryptoIcon } from '../Icons/CryptoIcon';

export const PaymentTable = ({ rows = 10 }: { rows?: number }) => {
  const { showError } = useSnackbar();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rows);

  const { data, isLoading } = usePayments({
    page: page,
    pageSize: rowsPerPage,
  });
  const handleChangePage = (event: any, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const downloadReceipt = async (paymentId: string) => {
    try {
      const invoiceUrl = await getReceipt(paymentId);
      window.open(invoiceUrl);
    } catch (error) {
      showError('Error downloading invoice');
    }
  };

  const renderPaymentStatus = (status: string) => {
    let color;
    let label;

    switch (status) {
      case 'succeeded':
        color = 'success';
        label = 'Completed';
        break;
      case 'failed':
        color = 'error';
        label = 'Failed';
        break;
      case 'pending':
        color = 'warning';
        label = 'Pending';
        break;
      default:
        color = 'default';
        label = status;
    }

    return (
      <Chip
        label={label}
        color={color as any}
        sx={{
          borderRadius: '16px',
          padding: '0 8px',
          fontWeight: 600,
          fontSize: '14px',
          textTransform: 'capitalize',
          height: '24px',
          lineHeight: '24px',
        }}
      />
    );
  };

  return (
    <Table
      columns={[
        {
          id: 'created_at',
          label: 'Payment Date',
          sortable: true,
          render: ({ createdAt }) => new Date(createdAt).toLocaleString(),
        },
        {
          id: 'amount',
          label: 'Amount USD',
          sortable: true,
          render: ({ amount, rate }) =>
            `$${Number(amount) > 0 ? Number(amount * rate).toFixed(2) : (Number(amount * rate) * -1).toFixed(2)}`,
        },
        {
          id: 'type',
          label: 'Payment Type',
          sortable: false,
          render: ({ type }) => (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {type === 'deposit' ? (
                <SaveAltOutlinedIcon
                  fontSize="small"
                  style={{
                    marginRight: '15px',
                  }}
                />
              ) : type === 'refund' ? (
                <CurrencyExchangeOutlinedIcon
                  fontSize="small"
                  style={{
                    marginRight: '15px',
                  }}
                />
              ) : type === 'withdrawal' ? (
                <img
                  src={CreditCardFilledIcon}
                  alt="Jobs"
                  style={{
                    marginRight: '15px',
                  }}
                />
              ) : (
                <MoneyOffCsredOutlinedIcon
                  fontSize="small"
                  style={{
                    marginRight: '15px',
                  }}
                />
              )}
              {paymentType[type]}
            </Box>
          ),
        },
        {
          id: 'source',
          label: 'Payment Method',
          sortable: false,
          render: ({ source }) => (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {source === 'fiat' ? (
                <CardIcon
                  fontSize="small"
                  style={{
                    marginRight: '15px',
                  }}
                />
              ) : source === 'balance' ? (
                <AccountBalanceWalletOutlinedIcon
                  fontSize="small"
                  style={{
                    marginRight: '15px',
                  }}
                />
              ) : (
                <CryptoIcon
                  fontSize="small"
                  style={{
                    marginRight: '15px',
                  }}
                />
              )}
              {paymentSource[source]}
            </Box>
          ),
        },
        {
          id: 'escrowAddress',
          label: 'Escrow Address',
          sortable: false,
          render: ({ escrowAddress }) =>
            escrowAddress ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {escrowAddress}
                <IconButton
                  color="primary"
                  sx={{ ml: 3 }}
                  onClick={() => copy(escrowAddress)}
                >
                  <CopyLinkIcon />
                </IconButton>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {escrowAddress}
                <Box>-</Box>
              </Box>
            ),
        },
        {
          id: 'status',
          label: 'Payment Status',
          sortable: false,
          render: ({ status }) => renderPaymentStatus(status),
        },
        {
          id: 'invoice',
          label: '',
          render: ({ transaction, source, type }) =>
            source === 'fiat' && type === 'deposit' ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                  color="primary"
                  sx={{ ml: 3 }}
                  onClick={() => downloadReceipt(transaction)}
                >
                  <DownloadIcon />
                </IconButton>
              </Box>
            ) : (
              ''
            ),
        },
      ]}
      data={data}
      loading={isLoading}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      emptyCell={
        <>
          <Typography variant="h5">
            There are no payments at the moment
          </Typography>
        </>
      }
    />
  );
};

export default PaymentTable;
