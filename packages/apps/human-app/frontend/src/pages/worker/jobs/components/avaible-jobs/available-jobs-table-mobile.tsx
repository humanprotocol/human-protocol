import { Grid, List, Paper, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProfileListItem } from '@/pages/operator/components/profile/profile-list-item';
import { colorPalette } from '@/styles/color-palette';
import { Button } from '@/components/ui/button';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { FiltersButtonIcon } from '@/components/ui/icons';
import { useMobileDrawerFilterStore } from '@/hooks/use-mobile-drawer-filter-store';
import { shortenEscrowAddress } from '../utils/shorten-escrow-address';
import {
  getJobsTableData,
  type AvailableJobs,
} from './available-jobs-table-service';

const parseUniqueValues = (data: AvailableJobs[]) => {
  const uniqueValues = {
    network: [...new Set(data.map((item) => item.network))],
    jobType: [...new Set(data.flatMap((item) => item.jobType))],
  };
  return uniqueValues;
};

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
  const { openMobileFilterDrawer, setUniqueValues, uniqueValues } =
    useMobileDrawerFilterStore();

  useEffect(() => {
    if (
      data &&
      uniqueValues.network.length === 0 &&
      uniqueValues.jobType.length === 0
    ) {
      setUniqueValues(parseUniqueValues(data));
    }
    const filtered = data?.filter((item) => {
      return item.escrowAddress.includes(searchEscrowAddress[0].value);
    });
    setFilteredData(filtered);
  }, [
    searchEscrowAddress,
    data,
    uniqueValues.network.length,
    uniqueValues.jobType.length,
    setUniqueValues,
  ]);

  return (
    <>
      <SearchForm
        columnId={t('worker.jobs.escrowAddressColumnId')}
        fullWidth
        label={t('worker.jobs.searchEscrowAddress')}
        name={t('worker.jobs.searchEscrowAddress')}
        placeholder={t('worker.jobs.searchEscrowAddress')}
        updater={setSearchEscrowAddress}
      />
      <Button
        fullWidth
        onClick={() => {
          openMobileFilterDrawer();
        }}
        sx={{
          marginBottom: '32px',
          marginTop: '21px',
        }}
        variant="outlined"
      >
        {t('worker.jobs.mobileFilterDrawer.filters')}
        <FiltersButtonIcon />
      </Button>
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
