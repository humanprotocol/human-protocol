import { Box, Tab, Tabs } from '@mui/material';
import React, { useState } from 'react';

enum PaymentTab {
  DailyAmount,
  DailyCount,
  DailyAvgPerJob,
  DailyAvgPerWorker,
}

export const PaymentsView = () => {
  const [tabValue, setTabValue] = useState(PaymentTab.DailyAmount);
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
          label="HMT Amount in a day"
          value={PaymentTab.DailyAmount}
          sx={{ alignItems: 'flex-start' }}
        />
        <Tab
          label="Count in a day"
          value={PaymentTab.DailyCount}
          sx={{ alignItems: 'flex-start' }}
        />
        <Tab
          label="Average HMT per job in a day"
          value={PaymentTab.DailyAvgPerJob}
          sx={{ alignItems: 'flex-start' }}
        />
        <Tab
          label="Average HMT per worker in a day"
          value={PaymentTab.DailyAvgPerWorker}
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
