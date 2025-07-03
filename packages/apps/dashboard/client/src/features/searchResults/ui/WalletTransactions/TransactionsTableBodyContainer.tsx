import type { FC, PropsWithChildren } from 'react';

import Grid from '@mui/material/Grid';
import MuiTableBody from '@mui/material/TableBody';

const TransactionsTableBodyContainer: FC<PropsWithChildren> = ({
  children,
}) => {
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
        <td>{children}</td>
      </Grid>
    </MuiTableBody>
  );
};

export default TransactionsTableBodyContainer;
