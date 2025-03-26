import ClearIcon from '@mui/icons-material/Clear';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

import { CheckFilledIcon } from '../../../components/Icons/CheckFilledIcon';

const ProgressText = styled(Typography)({
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
});

const CheckedIcon = styled(CheckFilledIcon)({
  position: 'absolute',
  left: '-30px',
});

const ProgressIcon = styled(CircularProgress)({
  position: 'absolute',
  left: '-30px',
});

const ErrorIcon = styled(ClearIcon)({
  position: 'absolute',
  left: '-30px',
});

export const LaunchJobProgress = ({
  isPayingFailed,
  goToPrevStep,
}: {
  isPayingFailed: boolean;
  goToPrevStep: () => void;
}) => {
  return (
    <Box
      sx={{
        background: '#fff',
        borderRadius: '16px',
        boxShadow:
          '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
        py: '180px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      <Box display="flex" flexDirection="column" gap={1}>
        <ProgressText>
          <CheckedIcon /> Creating Job
        </ProgressText>
        <ProgressText>
          <CheckedIcon /> Setting Up Job
        </ProgressText>
        <ProgressText>
          {isPayingFailed ? <ErrorIcon /> : <ProgressIcon size={20} />}
          Paying Job
        </ProgressText>
      </Box>
      <Button
        disabled={!isPayingFailed}
        color="primary"
        variant="outlined"
        sx={{ width: '240px', position: 'absolute', bottom: 16, right: 16 }}
        size="large"
        onClick={() => goToPrevStep?.()}
      >
        Cancel
      </Button>
    </Box>
  );
};
