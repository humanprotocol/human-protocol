/* eslint-disable camelcase */
import React, { useEffect, useRef, useState } from 'react';
import { Box, Grid, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { TableQueryContextProvider } from '@/shared/components/ui/table/table-query-context';
import { Modal } from '@/shared/components/ui/modal/modal';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { MyJobsTableMobile } from '@/modules/worker/components/jobs/my-jobs/mobile/my-jobs-table-mobile';
import { AvailableJobsTable } from '@/modules/worker/components/jobs/available-jobs/desktop/available-jobs-table';
import { MyJobsDrawerMobile } from '@/modules/worker/components/jobs/my-jobs/mobile/my-jobs-drawer-mobile';
import { AvailableJobsDrawerMobile } from '@/modules/worker/components/jobs/available-jobs/mobile/available-jobs-drawer-mobile';
import { useGetOracles } from '@/modules/worker/services/oracles';
import { useGetUiConfig } from '@/modules/worker/services/get-ui-config';
import { PageCardLoader } from '@/shared/components/ui/page-card/page-card-loader';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { useGetOraclesNotifications } from '@/modules/worker/hooks/use-get-oracles-notifications';
import { NoRecords } from '@/shared/components/ui/no-records';
import { AvailableJobsTableMobile } from '@/modules/worker/components/jobs/available-jobs/mobile/available-jobs-table-mobile';
import { TabPanel } from '@/modules/worker/components/jobs/jobs-tab-panel';
import { MyJobsTable } from '@/modules/worker/components/jobs/my-jobs/desktop/my-jobs-table';

function generateTabA11yProps(index: number) {
  return {
    id: `tab-${index.toString()}`,
    'aria-controls': `jobs-tabpanel-${index.toString()}`,
  };
}

export function JobsPage() {
  const { isDarkMode } = useColorMode();
  const {
    data,
    isError: isErrorGetOracles,
    isPending: isPendingGetOracles,
    error,
  } = useGetOracles();
  const {
    data: uiConfigData,
    isPending: isPendingUiConfig,
    isError: isErrorUiConfig,
  } = useGetUiConfig();
  const { address: oracle_address } = useParams<{ address: string }>();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const isMobile = useIsMobile();
  const [selectedTab, setSelectedTab] = useState<'availableJobs' | 'myJobs'>(
    'availableJobs'
  );

  const isError = isErrorGetOracles || isErrorUiConfig;
  const isPending = isPendingGetOracles || isPendingUiConfig;

  const [isMobileFilterDrawerOpen, setIsMobileFilterDrawerOpen] =
    useState(false);
  const { onError } = useGetOraclesNotifications();
  const onErrorRef = useRef(onError);

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
    if (error) {
      onErrorRef.current(error);
    }
  }, [error]);

  const oracleName = data?.find(
    ({ address }) => address === oracle_address
  )?.name;

  if (isPending) {
    return <PageCardLoader />;
  }

  return (
    <>
      <Modal isOpen={isMobileFilterDrawerOpen}>
        {selectedTab === 'availableJobs' && uiConfigData && (
          <AvailableJobsDrawerMobile
            chainIdsEnabled={uiConfigData.chainIdsEnabled}
            setIsMobileFilterDrawerOpen={setIsMobileFilterDrawerOpen}
          />
        )}
        {selectedTab === 'myJobs' && uiConfigData && (
          <MyJobsDrawerMobile
            chainIdsEnabled={uiConfigData.chainIdsEnabled}
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
              {!isError && (
                <Box
                  sx={{
                    padding: '8px 42px',
                    backgroundColor: isDarkMode ? '#CDC7FF14' : '#1406B20A',
                    display: 'inline-block',
                  }}
                >
                  <Typography variant="h6">{oracleName}</Typography>
                </Box>
              )}
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
                    {isError ? (
                      <NoRecords />
                    ) : (
                      <>
                        {isMobile ? (
                          <AvailableJobsTableMobile
                            setIsMobileFilterDrawerOpen={
                              setIsMobileFilterDrawerOpen
                            }
                          />
                        ) : (
                          <AvailableJobsTable
                            chainIdsEnabled={uiConfigData.chainIdsEnabled}
                          />
                        )}
                      </>
                    )}
                  </TabPanel>
                  <TabPanel activeTab={activeTab} index={1}>
                    {isError ? (
                      <NoRecords />
                    ) : (
                      <>
                        {isMobile ? (
                          <MyJobsTableMobile
                            setIsMobileFilterDrawerOpen={
                              setIsMobileFilterDrawerOpen
                            }
                          />
                        ) : (
                          <MyJobsTable
                            chainIdsEnabled={uiConfigData.chainIdsEnabled}
                          />
                        )}
                      </>
                    )}
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
