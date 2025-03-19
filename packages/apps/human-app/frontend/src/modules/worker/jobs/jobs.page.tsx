/* eslint-disable camelcase */
import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { TableQueryContextProvider } from '@/shared/components/ui/table/table-query-context';
import { Modal } from '@/shared/components/ui/modal/modal';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useColorMode } from '@/shared/contexts/color-mode';
import { NoRecords } from '@/shared/components/ui/no-records';
import { PageCardLoader } from '@/shared/components/ui/page-card';
import { useGetOracles } from '../hooks';
import { useGetOraclesNotifications } from '../hooks/use-get-oracles-notifications';
import { useGetUiConfig } from './hooks';
import { TabPanel } from './components';
import { MyJobsDrawerMobileView } from './my-jobs/components/mobile';
import {
  AvailableJobsView,
  AvailableJobsDrawerMobileView,
} from './available-jobs';
import { MyJobsView } from './my-jobs/my-jobs-view';

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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (newValue === 0) {
      setSelectedTab('availableJobs');
    }
    if (newValue === 1) {
      setSelectedTab('myJobs');
    }
  };

  const handleOpenMobileFilterDrawer = () => {
    setIsMobileFilterDrawerOpen(true);
  };

  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

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
          <AvailableJobsDrawerMobileView
            chainIdsEnabled={uiConfigData.chainIdsEnabled}
            setIsMobileFilterDrawerOpen={setIsMobileFilterDrawerOpen}
          />
        )}
        {selectedTab === 'myJobs' && uiConfigData && (
          <MyJobsDrawerMobileView
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
                      <AvailableJobsView
                        chainIdsEnabled={uiConfigData.chainIdsEnabled}
                        handleOpenMobileFilterDrawer={
                          handleOpenMobileFilterDrawer
                        }
                      />
                    )}
                  </TabPanel>
                  <TabPanel activeTab={activeTab} index={1}>
                    {isError ? (
                      <NoRecords />
                    ) : (
                      <MyJobsView
                        chainIdsEnabled={uiConfigData.chainIdsEnabled}
                        setIsMobileFilterDrawerOpen={
                          setIsMobileFilterDrawerOpen
                        }
                      />
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
