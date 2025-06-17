import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import FormatNumber from '@/shared/ui/FormatNumber';

import useGeneralStats from '../api/useGeneralStats';

const Holders = () => {
  const { data, isSuccess, isPending, isError } = useGeneralStats();

  return (
    <Box display="flex" flexDirection="column" gap={0.5}>
      <Typography variant="body1">Holders</Typography>
      <Typography variant="h6" component="p">
        {isSuccess && <FormatNumber value={data.totalHolders} />}
        {isPending && '...'}
        {isError && 'No data'}
      </Typography>
    </Box>
  );
};

export default Holders;
