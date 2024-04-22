import { Grid, List, Paper, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProfileListItem } from '@/pages/operator/components/profile/profile-list-item';
import { colorPalette } from '@/styles/color-palette';
import { Button } from '@/components/ui/button';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { shortenEscrowAddress } from '../utils/shorten-escrow-address';
import {
  getJobsTableData,
  type AvailableJobs,
} from './available-jobs-table-service';

export function AvailableJobsTableMobile() {
  const { t } = useTranslation();
  const [searchEscrowAddress, setSearchEscrowAddress] = useState([
    {
      id: '',
      value: '',
    },
  ]);
  const { data, isLoading } = useQuery<AvailableJobs[]>({
    queryKey: ['example', []],
    queryFn: () => getJobsTableData(),
  });
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    const filtered = data?.filter((item) => {
      return item.escrowAddress.includes(searchEscrowAddress[0].value);
    });
    setFilteredData(filtered);
  }, [searchEscrowAddress, data]);

  return (
    <>
      <SearchForm
        columnId={t('worker.jobs.escrowAddressColumnId')}
        label={t('worker.jobs.searchEscrowAddress')}
        name={t('worker.jobs.searchEscrowAddress')}
        placeholder={t('worker.jobs.searchEscrowAddress')}
        updater={setSearchEscrowAddress}
      />
      <Stack flexDirection="column">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          filteredData?.map((d) => (
            <Paper
              key={crypto.randomUUID()}
              sx={{
                px: '16px',
                py: '32px',
                backgroundColor: colorPalette.white,
                marginBottom: '20px',
              }}
            >
              <List>
                <ProfileListItem
                  header={t('worker.jobs.jobDescription')}
                  paragraph={d.jobDescription}
                />
                <Grid container>
                  <Grid item xs={6}>
                    <ProfileListItem
                      header={t('worker.jobs.escrowAddress')}
                      paragraph={shortenEscrowAddress(d.escrowAddress)}
                    />
                    <ProfileListItem
                      header={t('worker.jobs.rewardAmount')}
                      paragraph={d.rewardAmount}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <ProfileListItem
                      header={t('worker.jobs.network')}
                      paragraph={d.network}
                    />
                    <ProfileListItem
                      header={t('worker.jobs.jobType')}
                      paragraph={d.jobType}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      color="secondary"
                      fullWidth
                      size="small"
                      type="button"
                      variant="contained"
                    >
                      {t('worker.jobs.selectJob')}
                    </Button>
                  </Grid>
                </Grid>
              </List>
            </Paper>
          ))
        )}
      </Stack>
    </>
  );
}
