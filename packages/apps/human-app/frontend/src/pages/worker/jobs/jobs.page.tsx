/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Box, Grid, Link, Paper, Stack, Tab, Tabs } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useUserRegistrationMutation } from '@/api/services/worker/user-register';
import type { OracleSuccessResponse } from '@/api/services/worker/oracles';
import { FormCaptcha } from '@/components/h-captcha';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal/modal';
import { TableQueryContextProvider } from '@/components/ui/table/table-query-context';
import { useRegisteredOracles } from '@/contexts/registered-oracles'; // Importa el contexto
import { useBackgroundColorStore } from '@/hooks/use-background-store';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useResetMutationErrors } from '@/hooks/use-reset-mutation-errors';
import { AvailableJobsTable } from '@/pages/worker/jobs/components/available-jobs/desktop/available-jobs-table';
import { AvailableJobsDrawerMobile } from '@/pages/worker/jobs/components/available-jobs/mobile/available-jobs-drawer-mobile';
import { MyJobsDrawerMobile } from '@/pages/worker/jobs/components/my-jobs/mobile/my-jobs-drawer-mobile';
import { MyJobsTableMobile } from '@/pages/worker/jobs/components/my-jobs/mobile/my-jobs-table-mobile';
import { colorPalette } from '@/styles/color-palette';
import { useGetRegisteredOracles } from '@/api/services/worker/registered-oracles';
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
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false);
  const [hasClickedRegistrationLink, setHasClickedRegistrationLink] =
    useState(false);

  const location = useLocation();

  const oracleData: OracleSuccessResponse = location.state?.oracle;

  const { registeredOracles, setRegisteredOracles } = useRegisteredOracles();
  const { refetch: refetchRegisteredOracles } = useGetRegisteredOracles();

  useEffect(() => {
    const fetchOraclesIfNotAvailable = async () => {
      if (!registeredOracles || registeredOracles.length === 0) {
        const result = await refetchRegisteredOracles();
        if (result.data?.oracle_addresses) {
          setRegisteredOracles(result.data.oracle_addresses);
        }
      }
    };

    void fetchOraclesIfNotAvailable();
  }, [registeredOracles, refetchRegisteredOracles, setRegisteredOracles]);

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

  const handleLinkClick = () => {
    setHasClickedRegistrationLink(true);
  };

  const methods = useForm();

  const {
    mutate: userRegistrationMutate,
    error: userRegistrationError,
    isPending: isUserRegistrationPending,
    reset: isUserRegistrationMutationReset,
  } = useUserRegistrationMutation();

  useResetMutationErrors(methods.watch, isUserRegistrationMutationReset);

  const handleRegistrationComplete = () => {
    userRegistrationMutate(oracleData.address, {
      onSuccess(data) {
        setRegisteredOracles(
          registeredOracles?.concat([
            (data as { oracle_address: string }).oracle_address,
          ])
        );
      },
    });
    setIsRegistrationComplete(true);
  };

  const isOracleRegistered = registeredOracles?.includes(oracleData.address);

  if (
    oracleData.registrationNeeded &&
    !isOracleRegistered &&
    !isRegistrationComplete
  ) {
    return (
      <Grid alignItems="center" container justifyContent="center">
        <Grid item xs={12}>
          <Paper
            sx={{
              backgroundColor: isMobile
                ? colorPalette.paper.main
                : colorPalette.white,
              height: '100%',
              minHeight: '70vh',
              width: '100%',
              boxShadow: 'none',
              padding: isMobile ? '20px' : '40px',
              borderRadius: '20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Stack maxWidth="350px" spacing={2}>
              <Box>
                This oracle requires a registration process. Click on the link
                below to see the registration tutorial:
              </Box>
              <Link
                href={oracleData.registrationInstructions}
                onClick={handleLinkClick}
                rel="noopener"
                sx={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                }}
                target="_blank"
              >
                {oracleData.registrationInstructions}
              </Link>

              <Box>
                Click on Complete once you have finished the registration
                process:
              </Box>
              <FormProvider {...methods}>
                <form
                  onSubmit={(event) => {
                    void methods.handleSubmit(handleRegistrationComplete)(
                      event
                    );
                  }}
                >
                  <Stack alignItems="center" display="flex" spacing={2}>
                    <FormCaptcha
                      error={userRegistrationError}
                      name="h_captcha_token"
                    />

                    <Button
                      disabled={!hasClickedRegistrationLink}
                      fullWidth
                      loading={isUserRegistrationPending}
                      type="submit"
                      variant="contained"
                    >
                      Complete
                    </Button>
                  </Stack>
                </form>
              </FormProvider>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    );
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
              backgroundColor: isMobile
                ? colorPalette.paper.main
                : colorPalette.white,
              height: '100%',
              boxShadow: 'none',
              padding: isMobile ? '20px' : '40px',
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
