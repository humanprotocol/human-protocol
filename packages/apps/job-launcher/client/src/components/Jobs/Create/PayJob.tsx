import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { CardSetupForm } from '../../../components/CardSetup/CardSetupForm';
import { StyledTab, StyledTabs } from '../../../components/Tabs';
import { IS_TESTNET } from '../../../constants/chains';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import { useSnackbar } from '../../../providers/SnackProvider';
import { checkUserCard } from '../../../services/payment';
import { PayMethod } from '../../../types';
import { CryptoPayForm } from './CryptoPayForm';
import { FiatPayForm } from './FiatPayForm';
import { LaunchJobProgress } from './LaunchJobProgress';

export const PayJob = () => {
  const { payMethod, changePayMethod, goToNextStep } = useCreateJobPageUI();
  const [isPaying, setIsPaying] = useState(false);
  const [hasCard, setHasCard] = useState<boolean | null>(null);
  const { showError } = useSnackbar();

  useEffect(() => {
    const fetchCardStatus = async () => {
      const result = await checkUserCard();
      setHasCard(result);
    };

    fetchCardStatus();
  }, []);

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

  if (hasCard === null) {
    return (
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
        <div>Loading...</div>
      </Box>
    );
  }

  if (!hasCard) {
    return (
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
        <CardSetupForm onCardSetup={() => setHasCard(true)} />
      </Box>
    );
  }

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
        {IS_TESTNET && <StyledTab value={PayMethod.Fiat} label="Fiat" />}
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
    </Box>
  ) : (
    <LaunchJobProgress />
  );
};
