import { Box, Tab, Tabs } from '@mui/material';
import React, { useState } from 'react';

enum HMTTab {
  Holders,
  DailyTransactionsCount,
  DailyTransferedAmount,
}

export const HMTView = () => {
  const [tabValue, setTabValue] = useState(HMTTab.Holders);
  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'background.paper',
        display: 'flex',
      }}
    >
      <Tabs
        orientation="vertical"
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        sx={{
          '& .MuiTabs-indicator': {
            // display: 'none',
            width: '100%',
            left: 0,
            height: '2px !important',
            marginTop: '46px',
          },
        }}
      >
        <Tab
          label="Holders"
          value={HMTTab.Holders}
          sx={{ alignItems: 'flex-start' }}
        />
        <Tab
          label="Transactions count in a day"
          value={HMTTab.DailyTransactionsCount}
          sx={{ alignItems: 'flex-start' }}
        />
        <Tab
          label="HMT amount transfered in a day"
          value={HMTTab.DailyTransferedAmount}
          sx={{ alignItems: 'flex-start' }}
        />
      </Tabs>
      <Box
        sx={{
          flexGrow: 1,
          borderRadius: '8px',
          background: '#F6F7FE',
          py: 10,
          px: 5,
          ml: { xs: 4, md: 6, xl: 12 },
          minHeight: 400,
        }}
      ></Box>
    </Box>
  );
};
