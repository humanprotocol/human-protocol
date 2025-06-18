import { FC, useEffect } from 'react';

import { TableRow } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import MuiTableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';

import { EscrowsTableBodyContainer } from '@/pages/SearchResults/RoleDetails/RoleDetailsEscrows/tableComponents/EscrowsTableBodyContainer';
import { useEscrowDetails } from '@/services/api/use-escrows-details';
import { handleErrorMessage } from '@/services/handle-error-message';
import useGlobalFiltersStore from '@/shared/store/useGlobalFiltersStore';
import { useEscrowDetailsDto } from '@/utils/hooks/use-escrows-details-dto';

type Props = {
  role: string | null;
};

export const EscrowsTableBody: FC<Props> = ({ role }) => {
  const { chainId, address } = useGlobalFiltersStore();
  const { data, isPending, isError, error } = useEscrowDetails(
    role,
    chainId,
    address
  );
  const {
    setLastPageIndex,
    setPrevPage,
    pagination: { page },
  } = useEscrowDetailsDto();

  useEffect(() => {
    if (data?.results.length === 0) {
      setLastPageIndex(page);
      setPrevPage();
    }
  }, [data?.results, page, setLastPageIndex, setPrevPage]);

  useEffect(() => {
    setLastPageIndex(undefined);
  }, [address, chainId, setLastPageIndex]);

  if (isPending) {
    return (
      <EscrowsTableBodyContainer>
        <CircularProgress />
      </EscrowsTableBodyContainer>
    );
  }

  if (isError) {
    return (
      <EscrowsTableBodyContainer>
        <div>{handleErrorMessage(error)}</div>
      </EscrowsTableBodyContainer>
    );
  }

  if (!data.results.length) {
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
