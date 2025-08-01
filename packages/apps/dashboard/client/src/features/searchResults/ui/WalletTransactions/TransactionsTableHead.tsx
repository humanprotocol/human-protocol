import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import CustomTooltip from '@/shared/ui/CustomTooltip';

const InfoTooltip = ({ title }: { title: string }) => (
  <CustomTooltip
    title={title}
    slotProps={{
      tooltip: {
        sx: {
          maxWidth: '320px',
        },
      },
    }}
  >
    <HelpOutlineIcon
      fontSize="small"
      sx={{
        color: 'text.secondary',
        ml: 1,
      }}
    />
  </CustomTooltip>
);

const TransactionsTableHead = () => {
  return (
    <TableHead
      sx={{
        borderBottom: '1px solid',
        borderColor: 'text.secondary',
      }}
    >
      <TableRow>
        <TableCell>
          <Stack direction="row" alignItems="center">
            Transaction Hash
            <InfoTooltip title="Transaction identifier" />
          </Stack>
        </TableCell>
        <TableCell>
          <Stack direction="row" alignItems="center">
            Method
            <InfoTooltip title="Function executed in the transaction" />
          </Stack>
        </TableCell>
        <TableCell>From</TableCell>
        <TableCell>To</TableCell>
        <TableCell>
          <Stack direction="row" alignItems="center">
            Block
            <InfoTooltip title="Identifier of the block that contains the transaction" />
          </Stack>
        </TableCell>
        <TableCell>
          <Stack direction="row" alignItems="center">
            Value
            <InfoTooltip title="This column reflects transacted and approved amounts" />
          </Stack>
        </TableCell>
      </TableRow>
    </TableHead>
  );
};

export default TransactionsTableHead;
