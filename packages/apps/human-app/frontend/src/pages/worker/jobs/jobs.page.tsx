import { Box, Grid, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TableQueryContextProvider } from '@/components/ui/table/table-query-context';
import { colorPalette } from '@/styles/color-palette';
import { useBackgroundColorStore } from '@/hooks/use-background-store';
import { PageHeader } from '@/components/layout/protected/page-header';
import { ProfileWorkIcon } from '@/components/ui/icons';
import { AvailableJobsTable } from './components/avaible-jobs/available-jobs-table';
import { MyJobsTable } from './components/my-jobs/my-jobs-table';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      aria-labelledby={`simple-tab-${index}`}
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      role="tabpanel"
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export function JobsPage() {
  const { setGrayBackground } = useBackgroundColorStore();
  const { t } = useTranslation();
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    setGrayBackground();
  }, [setGrayBackground]);

  return (
    <Grid alignItems="center" container justifyContent="center">
      <Grid item xs={12}>
        <PageHeader
          headerIcon={<ProfileWorkIcon />}
          headerText={t('worker.jobs.jobsDiscovery')}
        />
      </Grid>
      <Grid item xs={12}>
        <Paper
          sx={{
            backgroundColor: colorPalette.white,
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
                    aria-label="basic tabs example"
                    onChange={handleChange}
                    value={value}
                  >
                    <Tab
                      label={t('worker.jobs.availableJobs')}
                      {...a11yProps(0)}
                    />
                    <Tab label={t('worker.jobs.myJobs')} {...a11yProps(1)} />
                  </Tabs>
                </Box>
                <CustomTabPanel index={0} value={value}>
                  <AvailableJobsTable />
                </CustomTabPanel>
                <CustomTabPanel index={1} value={value}>
                  <MyJobsTable />
                </CustomTabPanel>
              </Box>
            </TableQueryContextProvider>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
