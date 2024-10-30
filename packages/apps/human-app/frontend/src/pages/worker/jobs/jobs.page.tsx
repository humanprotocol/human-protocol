/* eslint-disable camelcase */
import React, { useState } from 'react';
import { Box, Grid, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { TableQueryContextProvider } from '@/components/ui/table/table-query-context';
import { Modal } from '@/components/ui/modal/modal';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { MyJobsTableMobile } from '@/pages/worker/jobs/components/my-jobs/mobile/my-jobs-table-mobile';
import { AvailableJobsTable } from '@/pages/worker/jobs/components/available-jobs/desktop/available-jobs-table';
import { MyJobsDrawerMobile } from '@/pages/worker/jobs/components/my-jobs/mobile/my-jobs-drawer-mobile';
import { AvailableJobsDrawerMobile } from '@/pages/worker/jobs/components/available-jobs/mobile/available-jobs-drawer-mobile';
import { useGetOracles } from '@/api/services/worker/oracles';
import { PageCardError, PageCardLoader } from '@/components/ui/page-card';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { useColorMode } from '@/hooks/use-color-mode';
import { AvailableJobsTableMobile } from './components/available-jobs/mobile/available-jobs-table-mobile';
import { TabPanel } from './components/jobs-tab-panel';
import { MyJobsTable } from './components/my-jobs/desktop/my-jobs-table';

function generateTabA11yProps(index: number) {
  return {
    id: `tab-${index.toString()}`,
    'aria-controls': `jobs-tabpanel-${index.toString()}`,
  };
}

export function JobsPage() {
  const { isDarkMode } = useColorMode();
  const { data, isError, isPending, error } = useGetOracles();
  const { address: oracle_address } = useParams<{ address: string }>();
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

  const oracleName = data?.find(
    ({ address }) => address === oracle_address
  )?.role;

  if (isError) {
    return <PageCardError errorMessage={defaultErrorMessage(error)} />;
  }

  if (isPending) {
    return <PageCardLoader />;
  }

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
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              height: '100%',
              boxShadow: 'none',
              padding: isMobile ? '20px' : '64px 144px',
              minHeight: '800px',
              borderRadius: '20px',
              backgroundColor: isMobile ? 'transparent' : undefined,
            }}
          >
            <div>
              <Box
                sx={{
                  padding: '8px 42px',
                  backgroundColor: isDarkMode ? '#CDC7FF14' : '#1406B20A',
                  display: 'inline-block',
                  borderRadius: '4px',
                }}
              >
                <Typography variant="h6">{oracleName}</Typography>
              </Box>
            </div>
            <Stack>
              <TableQueryContextProvider>
                <Box sx={{ width: '100%' }}>
                  <Box
                    sx={{
                      borderBottom: 1,
                      borderColor: isDarkMode ? '#CBCFE8CC' : 'divider',
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
