import Typography from '@mui/material/Typography';

import SectionWrapper from '@components/SectionWrapper';

import useKvstoreData from '@services/api/use-kvstore-data';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CustomTooltip from '@components/CustomTooltip';

const KVStore = () => {
  const { data } = useKvstoreData();
  console.log(data);
  return (
    <SectionWrapper>
      <Typography variant="h5" mb={1}>
        KV Store
      </Typography>
      <TableContainer>
        <Table
          aria-label="KV Store table"
          sx={{
            '& .MuiTableHead-root': {
              borderBottom: '1px solid rgba(203, 207, 232, 0.80)',
            },
            '& .MuiTableCell-root': {
              px: 0,
              borderBottom: 'none',
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>
                <CustomTooltip title="Key">
                  <HelpOutlineIcon fontSize="small" color="primary" />
                </CustomTooltip>
                Key
              </TableCell>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map((row) => (
              <TableRow key={row.key}>
                <TableCell>
                  {/* <CustomTooltip title={row.key}>
                    <HelpOutlineIcon fontSize="small" color="primary" />
                  </CustomTooltip> */}
                  {row.key}
                </TableCell>
                <TableCell>{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </SectionWrapper>
  );
};

export default KVStore;
