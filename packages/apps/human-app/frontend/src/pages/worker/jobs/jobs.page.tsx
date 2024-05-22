/* eslint-disable camelcase -- ... */
import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Stack, Tab, Tabs } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { TableQueryContextProvider } from '@/components/ui/table/table-query-context';
import { colorPalette } from '@/styles/color-palette';
import { useBackgroundColorStore } from '@/hooks/use-background-store';
import { Modal } from '@/components/ui/modal/modal';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useGetAvailableJobsData } from '@/api/servieces/worker/available-jobs-data';
import { AvailableJobsTable } from '@/pages/worker/jobs/components/available-jobs/available-jobs-table';
import { useGetMyJobsData } from '@/api/servieces/worker/my-jobs-data';
import { MyJobsTableMobile } from '@/pages/worker/jobs/components/my-jobs/my-jobs-table-mobile';
import { useMyJobsFilterStore } from '@/hooks/use-my-jobs-filter-store';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { routerPaths } from '@/router/router-paths';
import { AvailableJobsTableMobile } from './components/available-jobs/available-jobs-table-mobile';
import { DrawerMobile } from './components/drawer-mobile';
import { TabPanel } from './components/jobs-tab-panel';
import { MyJobsTable } from './components/my-jobs/my-jobs-table';

function generateTabA11yProps(index: number) {
  return {
    id: `tab-${index}`,
    'aria-controls': `jobs-tabpanel-${index}`,
  };
}

export function JobsPage() {
  const {
    filterParams: { oracle_address },
  } = useJobsFilterStore();
  const {
    filterParams: { address },
  } = useMyJobsFilterStore();

  useGetAvailableJobsData();
  useGetMyJobsData();
  const { setGrayBackground } = useBackgroundColorStore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const isMobile = useIsMobile();
  const [selectedTab, setSelectedTab] = useState('availableJobs');
  const [isMobileFilterDrawerOpen, setIsMobileFilterDrawerOpen] =
    useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (newValue === 0) {
      setSelectedTab('availableJobs');
    }
    if (newValue === 1) {
      setSelectedTab('myJobs');
    }
  };

  useEffect(() => {
    setGrayBackground();
  }, [setGrayBackground]);

  if (!oracle_address || !address) {
    return <Navigate to={routerPaths.worker.jobsDiscovery} />;
  }

  return (
    <>
      <Modal isOpen={isMobileFilterDrawerOpen}>
        <DrawerMobile
          selectedTab={selectedTab}
          setIsMobileFilterDrawerOpen={setIsMobileFilterDrawerOpen}
        />
      </Modal>
      <Grid alignItems="center" container justifyContent="center">
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
              borderRadius: '20px',
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
                      <AvailableJobsTableMobile
                        setIsMobileFilterDrawerOpen={
                          setIsMobileFilterDrawerOpen
                        }
                      />
                    ) : null}
                    {!isMobile ? <AvailableJobsTable /> : null}
                  </TabPanel>
                  <TabPanel activeTab={activeTab} index={1}>
                    <>
                      {isMobile ? (
                        <MyJobsTableMobile
                          setIsMobileFilterDrawerOpen={
                            setIsMobileFilterDrawerOpen
                          }
                        />
                      ) : null}
                      {!isMobile ? <MyJobsTable /> : null}
                    </>
                  </TabPanel>
                </Box>
              </TableQueryContextProvider>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
