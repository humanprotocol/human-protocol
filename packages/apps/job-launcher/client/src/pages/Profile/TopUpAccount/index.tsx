import { Box, Typography } from '@mui/material';
import React, { useState } from 'react';
import { StyledTab, StyledTabs } from '../../../components/Tabs';
import { CryptoTopUpForm } from '../../../components/TopUpAccount/CryptoTopUpForm';
import { FiatTopUpForm } from '../../../components/TopUpAccount/FiatTopUpForm';
import { TopUpMethod } from '../../../components/TopUpAccount/TopUpMethod';
import { PayMethod } from '../../../types';

export default function TopUpAccount() {
  const [payMethod, setPayMethod] = useState<PayMethod>();

  const handleSelectMethod = (method: PayMethod) => {
    setPayMethod(method);
  };

  return (
    <Box px="10%">
      <Typography variant="h4" fontWeight={600} mb={9}>
        Top up account
      </Typography>
      {payMethod === undefined ? (
        <TopUpMethod onSelectMethod={handleSelectMethod} />
      ) : (
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
            onChange={(e, newValue) => setPayMethod(newValue)}
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
              borderTopLeftRadius:
                payMethod === PayMethod.Crypto ? '0px' : '20px',
              borderTopRightRadius:
                payMethod === PayMethod.Fiat ? '0px' : '20px',
              px: '10%',
              pt: 10,
              pb: 5,
            }}
          >
            {payMethod === PayMethod.Crypto && <CryptoTopUpForm />}
            {payMethod === PayMethod.Fiat && <FiatTopUpForm />}
          </Box>
        </Box>
      )}
    </Box>
  );
}
