import { Box } from '@mui/material';
import { useState } from 'react';
import { StyledTab, StyledTabs } from '../../../components/Tabs';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import { useSnackbar } from '../../../providers/SnackProvider';
import { useAppSelector } from '../../../state';
import { PayMethod } from '../../../types';
import { CryptoPayForm } from './CryptoPayForm';
import { FiatPayForm } from './FiatPayForm';
import { LaunchJobProgress } from './LaunchJobProgress';

export const PayJob = () => {
  const { payMethod, changePayMethod, goToNextStep } = useCreateJobPageUI();
  const [isPaying, setIsPaying] = useState(false);
  const { showError } = useSnackbar();
  const { user } = useAppSelector((state) => state.auth);

  const handleStart = () => {
    setIsPaying(true);
  };

  const handleFinish = () => {
    setIsPaying(false);
    goToNextStep?.();
  };

  const handleError = (err: any) => {
    if (err.code === 'UNPREDICTABLE_GAS_LIMIT') {
      showError('Insufficient token amount or the gas limit is too low');
    } else if (err.code === 'ACTION_REJECTED') {
      showError('The transaction was rejected');
    } else {
      showError(err);
    }
  };

  return isPaying ? (
    <Box
      sx={{
        mx: 'auto',
        background: '#F6F7FE',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <StyledTabs
        value={payMethod}
        onChange={(e, newValue) => changePayMethod?.(newValue)}
        sx={{
          '& .MuiTabs-indicator': {
            display: 'none',
          },
          '& .MuiTabs-flexContainer': {
            background: '#F6F7FE',
          },
          marginBottom: '-2px',
        }}
      >
        {user?.whitelisted && (
          <StyledTab value={PayMethod.Crypto} label="Crypto" />
        )}
        <StyledTab value={PayMethod.Fiat} label="Fiat" />
      </StyledTabs>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        flex={1}
        sx={{
          background: '#fff',
          border: '1px solid #dbe1f6',
          borderRadius: '20px',
          borderTopLeftRadius:
            payMethod === PayMethod.Crypto || !user?.whitelisted
              ? '0px'
              : '20px',
          borderTopRightRadius: '20px',
          px: '10%',
          pt: 10,
          pb: 5,
        }}
      >
        {payMethod === PayMethod.Crypto && (
          <CryptoPayForm
            onStart={handleStart}
            onFinish={handleFinish}
            onError={handleError}
          />
        )}
        {payMethod === PayMethod.Fiat && (
          <FiatPayForm
            onStart={handleStart}
            onFinish={handleFinish}
            onError={handleError}
          />
        )}
      </Box>
    </Box>
  ) : (
    <LaunchJobProgress />
  );
};
