import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { FormatNumber } from '@components/Home/FormatNumber';
import { useHcaptchaGeneralStats } from '@services/api/use-hcaptcha-general-stats';

const TotalNumberOfTasks = () => {
  const { data, isError, isPending, isSuccess } = useHcaptchaGeneralStats();

  return (
    <Box display="flex" flexDirection="column" gap={0.5}>
      <Typography variant="body1">Total Number of Tasks</Typography>
      <Typography variant="h6" component="p">
        {isSuccess && <FormatNumber value={data.solved} />}
        {isPending && '...'}
        {isError && 'No data'}
      </Typography>
    </Box>
  );
};

export default TotalNumberOfTasks;
