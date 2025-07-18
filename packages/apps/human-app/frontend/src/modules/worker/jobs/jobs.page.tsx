/* eslint-disable camelcase */
import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { TableQueryContextProvider } from '@/shared/components/ui/table/table-query-context';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useColorMode } from '@/shared/contexts/color-mode';
import { NoRecords } from '@/shared/components/ui/no-records';
import { PageCardLoader } from '@/shared/components/ui/page-card';
import { useGetUiConfig } from '@/shared/hooks';
import { useGetOracles } from '../hooks';
import { useGetOraclesNotifications } from '../hooks/use-get-oracles-notifications';
import { TabPanel } from './components';
import { AvailableJobsView } from './available-jobs';
import { MyJobsView } from './my-jobs/my-jobs-view';

function generateTabA11yProps(index: number) {
  return {
    id: `tab-${index.toString()}`,
    'aria-controls': `jobs-tabpanel-${index.toString()}`,
  };
}

function CvatErrorBanner({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection={{ xs: 'column', sm: 'row' }}
      mt={2}
      p={2}
      gap={1}
      bgcolor={isDarkMode ? '#CDC7FF14' : '#1406B20A'}
    >
      <ErrorIcon />
      <Typography variant="body1">
        We know what went down and we are fixing it - We will update via our
        status page
      </Typography>
    </Box>
  );
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

  const isError = isErrorGetOracles || isErrorUiConfig;
  const isPending = isPendingGetOracles || isPendingUiConfig;
  const { onError } = useGetOraclesNotifications();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  const oracleName = data?.find(
    ({ address }) => address === oracle_address
  )?.name;

  const isCVAT = oracleName === 'CVAT';

  if (isPending) {
    return <PageCardLoader />;
  }

  return (
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
          {isCVAT && <CvatErrorBanner isDarkMode={isDarkMode} />}
          <Stack display={isCVAT ? 'none' : 'block'}>
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
                    />
                  )}
                </TabPanel>
                <TabPanel activeTab={activeTab} index={1}>
                  {isError ? (
                    <NoRecords />
                  ) : (
                    <MyJobsView
                      chainIdsEnabled={uiConfigData.chainIdsEnabled}
                    />
                  )}
                </TabPanel>
              </Box>
            </TableQueryContextProvider>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
