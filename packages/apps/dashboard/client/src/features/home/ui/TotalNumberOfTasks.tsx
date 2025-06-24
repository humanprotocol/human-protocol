import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import FormattedNumber from '@/shared/ui/FormattedNumber';

import useHcaptchaGeneralStats from '../api/useHcaptchaGeneralStats';

const TotalNumberOfTasks = () => {
  const { data, isError, isPending, isSuccess } = useHcaptchaGeneralStats();

  return (
    <Box display="flex" flexDirection="column" gap={0.5}>
      <Typography variant="body1">Total Number of Tasks</Typography>
      <Typography variant="h6" component="p">
        {isSuccess && <FormattedNumber value={data.solved} />}
        {isPending && '...'}
        {isError && 'No data'}
      </Typography>
    </Box>
  );
};

export default TotalNumberOfTasks;
