import Typography from '@mui/material/Typography';

import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import SectionWrapper from '@components/SectionWrapper';
import useKvstoreData from '@services/api/use-kvstore-data';

const KVStore = () => {
  const { data } = useKvstoreData();

  if (data?.length === 0) {
    return null;
  }

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
              borderBottom: 'none',
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>Key</TableCell>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map((row) => (
              <TableRow key={row.key}>
                <TableCell>{row.key}</TableCell>
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
