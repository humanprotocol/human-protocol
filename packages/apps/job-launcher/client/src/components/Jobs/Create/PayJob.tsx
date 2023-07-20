import { Box } from '@mui/material';
import React from 'react';
import { StyledTabs, StyledTab } from '../../../components/Tabs';
import { useCreateJobPageUI } from '../../../providers/CreateJobPageUIProvider';
import { PayMethod } from '../../../types';
import { CryptoPayForm } from './CryptoPayForm';
import { FiatPayForm } from './FiatPayForm';

export const PayJob = () => {
  const { payMethod, changePayMethod } = useCreateJobPageUI();

  return (
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
        {payMethod === PayMethod.Crypto && <CryptoPayForm />}
        {payMethod === PayMethod.Fiat && <FiatPayForm />}
      </Box>
    </Box>
  );
};
