import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import FormatNumber from '@/shared/ui/FormatNumber';

import useGeneralStats from '../api/useGeneralStats';

const TotalTransactions = () => {
  const { data, isError, isPending, isSuccess } = useGeneralStats();

  return (
    <Box display="flex" flexDirection="column" gap={0.5}>
      <Typography variant="body1">Total Transactions</Typography>
      <Typography variant="h6" component="p">
        {isSuccess && <FormatNumber value={data.totalTransactions} />}
        {isPending && '...'}
        {isError && 'No data'}
      </Typography>
    </Box>
  );
};

export default TotalTransactions;
