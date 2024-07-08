import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Stack, Tab, Tabs } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { TableQueryContextProvider } from '@/components/ui/table/table-query-context';
import { colorPalette } from '@/styles/color-palette';
import { useBackgroundColorStore } from '@/hooks/use-background-store';
import { Modal } from '@/components/ui/modal/modal';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { MyJobsTableMobile } from '@/pages/worker/jobs/components/my-jobs/mobile/my-jobs-table-mobile';
import { AvailableJobsTable } from '@/pages/worker/jobs/components/available-jobs/desktop/available-jobs-table';
import { MyJobsDrawerMobile } from '@/pages/worker/jobs/components/my-jobs/mobile/my-jobs-drawer-mobile';
import { AvailableJobsDrawerMobile } from '@/pages/worker/jobs/components/available-jobs/mobile/available-jobs-drawer-mobile';
import { AvailableJobsTableMobile } from './components/available-jobs/mobile/available-jobs-table-mobile';
import { TabPanel } from './components/jobs-tab-panel';
import { MyJobsTable } from './components/my-jobs/desktop/my-jobs-table';

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
  const [selectedTab, setSelectedTab] = useState<'availableJobs' | 'myJobs'>(
    'availableJobs'
  );
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

  return (
    <>
      <Modal
        isOpen={isMobileFilterDrawerOpen}
        sx={{ position: 'absolute', zIndex: '1400' }}
      >
        {selectedTab === 'availableJobs' ? (
          <AvailableJobsDrawerMobile
            setIsMobileFilterDrawerOpen={setIsMobileFilterDrawerOpen}
          />
        ) : (
          <MyJobsDrawerMobile
            setIsMobileFilterDrawerOpen={setIsMobileFilterDrawerOpen}
          />
        )}
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
