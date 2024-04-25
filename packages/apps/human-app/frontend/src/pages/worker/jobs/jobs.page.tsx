import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { TableQueryContextProvider } from '@/components/ui/table/table-query-context';
import { colorPalette } from '@/styles/color-palette';
import { useBackgroundColorStore } from '@/hooks/use-background-store';
import { PageHeader } from '@/components/layout/protected/page-header';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { HomepageWorkIcon } from '@/components/ui/icons';
import { useMobileDrawerFilterStore } from '@/hooks/use-mobile-drawer-filter-store';
import { AvailableJobsTable } from './components/avaible-jobs/available-jobs-table';
import { MyJobsTable } from './components/my-jobs/my-jobs-table';
import { AvailableJobsTableMobile } from './components/avaible-jobs/available-jobs-table-mobile';
import { MyJobsTableMobile } from './components/my-jobs/my-jobs-table-mobile';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  activeTab: number;
}

function TabPanel({ children, index, activeTab }: TabPanelProps) {
  return (
    <div
      aria-labelledby={`tabpanel-${index}`}
      hidden={activeTab !== index}
      id={`jobs-tabpanel-${index}`}
      role="tabpanel"
    >
      {activeTab === index && (
        <Box sx={{ py: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function generateTabA11yProps(index: number) {
  return {
    id: `tab-${index}`,
    'aria-controls': `jobs-tabpanel-${index}`,
  };
}

export function JobsPage() {
  const { setGrayBackground } = useBackgroundColorStore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const isMobile = useIsMobile();
  const { setActiveJobsTab } = useMobileDrawerFilterStore();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (newValue === 0) {
      setActiveJobsTab('availableJobs');
    }
    if (newValue === 1) {
      setActiveJobsTab('myJobs');
    }
  };

  useEffect(() => {
    setGrayBackground();
  }, [setGrayBackground]);

  return (
    <Grid alignItems="center" container justifyContent="center">
      <Grid item xs={12}>
        <PageHeader
          backgroundColor={colorPalette.paper.main}
          headerIcon={<HomepageWorkIcon />}
          headerText={t('worker.jobs.jobsDiscovery')}
        />
      </Grid>
      <Grid item xs={12}>
        <Paper
          sx={{
            backgroundColor: isMobile
              ? colorPalette.paper.main
              : colorPalette.white,
            height: '100%',
            boxShadow: 'none',
            padding: '40px',
            minHeight: '800px',
          }}
        >
          <Stack>
            <TableQueryContextProvider>
              <Box sx={{ width: '100%' }}>
                <Box
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Tabs
                    aria-label="jobs-tabs"
                    onChange={handleTabChange}
                    value={activeTab}
                  >
                    <Tab
                      label={t('worker.jobs.availableJobs')}
                      {...generateTabA11yProps(0)}
                    />
                    <Tab
                      label={t('worker.jobs.myJobs')}
                      {...generateTabA11yProps(1)}
                    />
                  </Tabs>
                </Box>
                <TabPanel activeTab={activeTab} index={0}>
                  {isMobile ? (
                    <AvailableJobsTableMobile />
                  ) : (
                    <AvailableJobsTable />
                  )}
                </TabPanel>
                <TabPanel activeTab={activeTab} index={1}>
                  {isMobile ? <MyJobsTableMobile /> : <MyJobsTable />}
                </TabPanel>
              </Box>
            </TableQueryContextProvider>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
