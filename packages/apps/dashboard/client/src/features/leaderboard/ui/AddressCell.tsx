import { FC } from 'react';

import { ChainId } from '@human-protocol/sdk/src/enums';
import Box from '@mui/material/Box';

import AbbreviateClipboard from '@/shared/ui/AbbreviateClipboard';

type Props = {
  chainId: ChainId;
  address: string;
};

const AddressCell: FC<Props> = ({ chainId, address }) => (
  <Box display="flex" alignItems="center" height="100%">
    <AbbreviateClipboard
      value={address}
      link={`/search/${chainId}/${address}`}
    />
  </Box>
);

export default AddressCell;
