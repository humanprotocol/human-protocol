import { FC } from 'react';

import { TableRow } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import MuiTableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';

import { PaginatedEscrowDetails } from '@/features/searchResults/model/escrowDetailsSchema';
import { handleErrorMessage } from '@/services/handle-error-message';
import useGlobalFiltersStore from '@/shared/store/useGlobalFiltersStore';

import EscrowsTableBodyContainer from './EscrowsTableBodyContainer';

type Props = {
  data: PaginatedEscrowDetails | undefined;
  isLoading: boolean;
  error: Error | null;
};

const EscrowsTableBody: FC<Props> = ({ data, isLoading, error }) => {
  const { chainId } = useGlobalFiltersStore();

  if (isLoading) {
    return (
      <EscrowsTableBodyContainer>
        <CircularProgress />
      </EscrowsTableBodyContainer>
    );
  }

  if (error) {
    return (
      <EscrowsTableBodyContainer>
        <div>{handleErrorMessage(error)}</div>
      </EscrowsTableBodyContainer>
    );
  }

  if (!data?.results.length) {
    return (
      <EscrowsTableBodyContainer>
        <div>No escrows launched yet</div>
      </EscrowsTableBodyContainer>
    );
  }

  return (
    <MuiTableBody>
      {data.results.map((elem, idx) => (
        <TableRow key={idx}>
          <TableCell
            sx={{
              padding: '0 0 24px 0',
            }}
          >
            <Link
              target="_blank"
              href={`/search/${chainId}/${elem.address}`}
              sx={{ textDecoration: 'unset' }}
            >
              {elem.address}
            </Link>
          </TableCell>
        </TableRow>
      ))}
    </MuiTableBody>
  );
};

export default EscrowsTableBody;
