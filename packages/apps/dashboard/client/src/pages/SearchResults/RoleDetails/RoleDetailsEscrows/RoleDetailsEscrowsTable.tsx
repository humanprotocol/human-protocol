import { useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TablePagination from '@mui/material/TablePagination';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { EscrowsTableBody } from '@/pages/SearchResults/RoleDetails/RoleDetailsEscrows/tableComponents/EscrowsTableBody';
import SectionWrapper from '@/components/SectionWrapper';
import { useEscrowDetailsDto } from '@/utils/hooks/use-escrows-details-dto';
import { useEscrowDetails } from '@/services/api/use-escrows-details';

export const RoleDetailsEscrowsTable = ({ role }: { role: string | null }) => {
  const { data } = useEscrowDetails({ role });
  const {
    pagination: { page, pageSize, lastPageIndex },
    setPageSize,
    setNextPage,
    setPrevPage,
  } = useEscrowDetailsDto();

  useEffect(() => {
    return () => {
      setPageSize(10);
    };
  }, [setPageSize]);

  return (
    <SectionWrapper>
      <Typography variant="h5" mb={3}>
        Escrows
      </Typography>
      <TableContainer>
        <Table
          sx={{
            '& .MuiTableCell-root': {
              borderBottom: 'none',
            },
          }}
          aria-label="Escrows table"
        >
          <TableHead>
            <TableRow></TableRow>
          </TableHead>
          <EscrowsTableBody role={role} />
        </Table>
      </TableContainer>
      <Stack width="100%">
        <TablePagination
          // count is unknown but required as props
          count={Number.MAX_SAFE_INTEGER}
          // onPageChange is required as props
          onPageChange={() => {}}
          page={page}
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
          component="div"
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
      </Stack>
    </SectionWrapper>
  );
};
