import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import FormattedNumber from '@/shared/ui/FormattedNumber';

import useGeneralStats from '../api/useGeneralStats';

const TotalTransactions = () => {
  const { data, isError, isPending, isSuccess } = useGeneralStats();

  return (
    <Box display="flex" flexDirection="column" gap={0.5}>
      <Typography variant="body1">Total Transactions</Typography>
      <Typography variant="h6" component="p">
        {isSuccess && <FormattedNumber value={data.totalTransactions} />}
        {isPending && '...'}
        {isError && 'No data'}
      </Typography>
    </Box>
  );
};

export default TotalTransactions;
