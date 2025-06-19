import { FC, PropsWithChildren } from 'react';

import { Grid } from '@mui/material';
import MuiTableBody from '@mui/material/TableBody';

const EscrowsTableBodyContainer: FC<PropsWithChildren> = ({ children }) => {
  return (
    <MuiTableBody sx={{ position: 'relative', height: ' 40vh' }}>
      <Grid
        component="tr"
        container
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <th>{children}</th>
      </Grid>
    </MuiTableBody>
  );
};

export default EscrowsTableBodyContainer;
