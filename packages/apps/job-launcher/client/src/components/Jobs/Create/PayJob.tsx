import { Box, Snackbar, Alert } from '@mui/material';
import React, { useState } from 'react';
import { StyledTabs, StyledTab } from '../../../components/Tabs';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import { PayMethod } from '../../../types';
import { CryptoPayForm } from './CryptoPayForm';
import { FiatPayForm } from './FiatPayForm';
import { LaunchJobProgress } from './LaunchJobProgress';

export const PayJob = () => {
  const { payMethod, changePayMethod, goToNextStep } = useCreateJobPageUI();
  const [isPaying, setIsPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStart = () => {
    setIsPaying(true);
  };

  const handleFinish = () => {
    setIsPaying(false);
    goToNextStep?.();
  };

  const handleError = (err: any) => {
    if (
      err.code === 'UNPREDICTABLE_GAS_LIMIT' ||
      err.code === 'ACTION_REJECTED'
    ) {
      setErrorMessage(err.code);
    } else {
      setErrorMessage(err.message);
    }
  };

  return !isPaying ? (
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
        <StyledTab value={PayMethod.Crypto} label="Crypto" />
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
          borderTopLeftRadius: payMethod === 0 ? '0px' : '20px',
          borderTopRightRadius: payMethod === 1 ? '0px' : '20px',
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
      <Snackbar
        open={errorMessage !== null}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setErrorMessage(null)} severity="error">
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  ) : (
    <LaunchJobProgress />
  );
};
