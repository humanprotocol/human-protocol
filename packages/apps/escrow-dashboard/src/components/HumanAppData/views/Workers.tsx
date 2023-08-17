import { Box, Tab, Tabs } from '@mui/material';
import React, { useState } from 'react';

enum WorkerTab {
  TotalWorkers,
  DailyActiveWorkers,
  AverageJobs,
}

export const WorkersView = () => {
  const [tabValue, setTabValue] = useState(WorkerTab.TotalWorkers);
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
          label="Total workers"
          value={WorkerTab.TotalWorkers}
          sx={{ alignItems: 'flex-start' }}
        />
        <Tab
          label="Active"
          value={WorkerTab.DailyActiveWorkers}
          sx={{ alignItems: 'flex-start' }}
        />
        <Tab
          label="Average Jobs"
          value={WorkerTab.AverageJobs}
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
