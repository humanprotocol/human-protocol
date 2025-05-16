import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import CustomTooltip from '@components/CustomTooltip';

const InfoTooltip = ({ title }: { title: string }) => (
  <CustomTooltip title={title}>
    <HelpOutlineIcon
      fontSize="small"
      sx={{
        color: 'text.secondary',
        ml: 1,
      }}
    />
  </CustomTooltip>
);

export const TransactionsTableHead = () => {
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
            <Typography variant="Components/Table Header">
              Transaction Hash
            </Typography>
            <InfoTooltip title="Transaction identifier" />
          </Stack>
        </TableCell>
        <TableCell>
          <Stack direction="row" alignItems="center">
            <Typography variant="Components/Table Header">Method</Typography>
            <InfoTooltip title="Function executed in the transaction" />
          </Stack>
        </TableCell>
        <TableCell>
          <Typography variant="Components/Table Header">From</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="Components/Table Header">To</Typography>
        </TableCell>
        <TableCell>
          <Stack direction="row" alignItems="center">
            <Typography variant="Components/Table Header">Block</Typography>
            <InfoTooltip title="Identifier of the block that contains the transaction" />
          </Stack>
        </TableCell>
        <TableCell>
          <Stack direction="row" alignItems="center">
            <Typography variant="Components/Table Header">Value</Typography>
            <InfoTooltip title="Amount of HMT transferred in the transaction" />
          </Stack>
        </TableCell>
      </TableRow>
    </TableHead>
  );
};
