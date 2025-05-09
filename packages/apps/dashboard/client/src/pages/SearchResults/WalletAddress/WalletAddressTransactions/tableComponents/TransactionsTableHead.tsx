import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { colorPalette } from '@assets/styles/color-palette';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CustomTooltip from '@components/CustomTooltip';

export const TransactionsTableHead = () => {
  return (
    <TableHead
      sx={{
        borderBottom: `1px solid ${colorPalette.fog.main}`,
      }}
    >
      <TableRow>
        <TableCell
          sx={{
            p: 0,
          }}
        >
          <Stack direction="row" alignItems="center">
            <CustomTooltip title="Transaction identifier">
              <IconButton sx={{ padding: 0, paddingRight: 1 }}>
                <HelpOutlineIcon
                  fontSize="small"
                  style={{
                    color: colorPalette.sky.main,
                  }}
                />
              </IconButton>
            </CustomTooltip>
            <Typography variant="Components/Table Header">
              Transaction Hash
            </Typography>
          </Stack>
        </TableCell>
        <TableCell>
          <Stack direction="row" alignItems="center">
            <CustomTooltip title="Function executed in the transaction">
              <IconButton sx={{ padding: 0, paddingRight: 1 }}>
                <HelpOutlineIcon
                  fontSize="small"
                  style={{
                    color: colorPalette.sky.main,
                  }}
                />
              </IconButton>
            </CustomTooltip>
            <Typography variant="Components/Table Header">Method</Typography>
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
            <CustomTooltip title="Identifier of the block that contains the transaction">
              <IconButton sx={{ padding: 0, paddingRight: 1 }}>
                <HelpOutlineIcon
                  fontSize="small"
                  style={{
                    color: colorPalette.sky.main,
                  }}
                />
              </IconButton>
            </CustomTooltip>
            <Typography variant="Components/Table Header">Block</Typography>
          </Stack>
        </TableCell>
        <TableCell>
          <Stack direction="row" alignItems="center">
            <CustomTooltip title="Amount of HMT transferred in the transaction">
              <IconButton sx={{ padding: 0, paddingRight: 1 }}>
                <HelpOutlineIcon
                  fontSize="small"
                  style={{
                    color: colorPalette.sky.main,
                  }}
                />
              </IconButton>
            </CustomTooltip>
            <Typography variant="Components/Table Header">Value</Typography>
          </Stack>
        </TableCell>
      </TableRow>
    </TableHead>
  );
};
