import { Box } from '@mui/material';

import AbbreviateClipboard from '@/components/SearchResults/AbbreviateClipboard';

export const AddressCell = ({
  chainId,
  address,
}: {
  chainId: string;
  address: string;
}) => (
  <Box display="flex" alignItems="center" height="100%">
    <AbbreviateClipboard
      value={address}
      link={`/search/${chainId}/${address}`}
    />
  </Box>
);
