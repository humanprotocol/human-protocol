import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { AddressDetailsLeader } from '@services/api/use-address-details';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import { EscrowsTableBody } from '@pages/SearchResults/RoleDetails/RoleDetailsEscrows/tableComponents/EscrowsTableBody';
import TablePagination from '@mui/material/TablePagination';
import { useEscrowDetailsDto } from '@utils/hooks/use-escrows-details-dto';
import { useEscrowDetails } from '@services/api/use-escrows-details';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Stack } from '@mui/material';

export const RoleDetailsEscrowsTable = ({
  role,
}: {
  role: AddressDetailsLeader['role'];
}) => {
  const { data } = useEscrowDetails({ role });
  const {
    pagination: { page, pageSize, lastPageIndex },
    setPageSize,
    setNextPage,
    setPrevPage,
  } = useEscrowDetailsDto();

  return (
    <Card
      sx={{
        paddingX: { xs: 2, md: 8 },
        paddingY: { xs: 4, md: 6 },
        marginBottom: 4,
        borderRadius: '16px',
        boxShadow: 'none',
      }}
    >
      <Box>
        <Typography
          sx={{
            marginBottom: 3,
          }}
          variant="h5"
        >
          Escrows
        </Typography>
        <TableContainer>
          <Table
            sx={{
              '& .MuiTableCell-root': {
                borderBottom: 'none',
              },
            }}
            aria-label="simple-table"
          >
            <TableHead>
              <TableRow></TableRow>
            </TableHead>
            <EscrowsTableBody role={role} />
          </Table>
        </TableContainer>
        <Stack
          sx={{
            width: '100%',
            display: 'flex',
          }}
        >
          <TablePagination
            // count is unknown but required as props
            count={9999}
            sx={{
              '& .MuiTablePagination-toolbar': {
                paddingLeft: 0,
              },
            }}
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
      </Box>
    </Card>
  );
};
