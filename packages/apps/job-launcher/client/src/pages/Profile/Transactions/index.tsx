import { Box, Grid, Typography } from '@mui/material';
import { PaymentTable } from '../../../components/Payment/PaymentTable';

const Transactions = () => {
  return (
    <Box>
      <Box
        mb={8}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" fontWeight={600}>
          Transactions
        </Typography>
      </Box>

      <Grid container spacing={4} mb={11}>
        <Grid item xs={12}>
          <PaymentTable />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Transactions;
