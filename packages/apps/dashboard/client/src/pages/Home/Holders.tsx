import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { FormatNumber } from '@components/Home/FormatNumber';
import { useGeneralStats } from '@services/api/use-general-stats';

export function Holders() {
  const { data, isSuccess, isPending, isError } = useGeneralStats();

  return (
    <div>
      <Typography variant="body1" component="p">
        Holders
      </Typography>
      <Box display="flex" fontSize={20} fontWeight={500} mt={0.5}>
        {isSuccess && <FormatNumber value={data.totalHolders} />}
        {isPending && '...'}
        {isError && 'No data'}
      </Box>
    </div>
  );
}
