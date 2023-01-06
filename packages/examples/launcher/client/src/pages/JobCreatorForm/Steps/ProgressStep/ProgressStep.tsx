import * as React from 'react';
import LinearProgress, {
  LinearProgressProps,
} from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Grid } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

const LinearProgressWithLabel = (
  props: LinearProgressProps & { value: number }
) => {
  const { value } = props;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
          value
        )}%`}</Typography>
      </Box>
    </Box>
  );
};

export interface IProgressStep {
  nextStep: () => void;
  prevStep: () => void;
}

export const ProgressStep: React.FC<IProgressStep> = ({
  nextStep,
  prevStep,
}) => {
  const [progress, setProgress] = React.useState(10);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) =>
        prevProgress >= 100 ? 10 : prevProgress + 10
      );
    }, 800);
    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Box
      sx={{
        width: '70%',
        display: 'flex',
        flexDirection: 'column',
        m: '200px auto 0 auto',
      }}
    >
      <LinearProgressWithLabel value={progress} />
      <Grid
        item
        container
        justifyContent="center"
        rowSpacing={5}
        sx={{
          maxWidth: { sm: '40rem' },
          marginInline: 'auto',
        }}
      >
        <span>JOB CREATION IN PROGRESS</span>
        <Grid item xs={12} sm={10}>
          <LoadingButton
            loading={false}
            type="submit"
            variant="contained"
            onClick={prevStep}
            sx={{
              py: '0.8rem',
              mt: 2,
              width: '100%',
              marginInline: 'auto',
              backgroundColor: '#fff',
              color: '#6309ff',
              border: '1px solid #6309ff',
              '&:hover': {
                backgroundColor: '#6309ff',
                color: '#fff',
              },
            }}
          >
            Back
          </LoadingButton>

          <LoadingButton
            loading={false}
            type="submit"
            variant="contained"
            onClick={nextStep}
            sx={{
              py: '0.8rem',
              mt: 2,
              width: '100%',
              marginInline: 'auto',
              backgroundColor: '#fff',
              color: '#6309ff',
              border: '1px solid #6309ff',
              '&:hover': {
                backgroundColor: '#6309ff',
                color: '#fff',
              },
            }}
          >
            Next
          </LoadingButton>
        </Grid>
      </Grid>
    </Box>
  );
};
