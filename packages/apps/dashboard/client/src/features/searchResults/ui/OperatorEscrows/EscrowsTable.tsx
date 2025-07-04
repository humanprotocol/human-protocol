import type { FC } from 'react';

import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import useGlobalFiltersStore from '@/shared/store/useGlobalFiltersStore';
import SectionWrapper from '@/shared/ui/SectionWrapper';

import useEscrowDetails from '../../api/useEscrowDetails';
import usePagination from '../../hooks/usePagination';
import TablePagination from '../TablePagination';

import EscrowsTableBody from './EscrowsTableBody';

type Props = {
  role: string | null;
};

const EscrowsTable: FC<Props> = ({ role }) => {
  const { chainId, address } = useGlobalFiltersStore();
  const {
    pagination: { page, pageSize, lastPageIndex },
    params,
    setPageSize,
    setNextPage,
    setPrevPage,
    setLastPageIndex,
  } = usePagination();
  const { data, isLoading, error } = useEscrowDetails({
    role,
    chainId,
    address,
    page,
    lastPageIndex,
    params,
    setLastPageIndex,
  });

  return (
    <SectionWrapper>
      <Typography variant="h5" mb={3}>
        Escrows
      </Typography>
      <TableContainer>
        <Table
          aria-label="Escrows table"
          sx={{
            '& .MuiTableCell-root': {
              borderBottom: 'none',
            },
          }}
        >
          <TableHead>
            <TableRow />
          </TableHead>
          <EscrowsTableBody data={data} isLoading={isLoading} error={error} />
          <TableFooter>
            <TableRow>
              <TablePagination
                page={page}
                pageSize={pageSize}
                resultsLength={data?.results.length ?? 0}
                lastPageIndex={lastPageIndex}
                isDataLoading={isLoading}
                setPageSize={setPageSize}
                setNextPage={setNextPage}
                setPrevPage={setPrevPage}
                setLastPageIndex={setLastPageIndex}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </SectionWrapper>
  );
};

export default EscrowsTable;
