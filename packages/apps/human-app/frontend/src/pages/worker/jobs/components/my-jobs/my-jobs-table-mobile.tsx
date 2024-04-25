import { Grid, List, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProfileListItem } from '@/pages/operator/components/profile/profile-list-item';
import { colorPalette } from '@/styles/color-palette';
import { Button } from '@/components/ui/button';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { FiltersButtonIcon } from '@/components/ui/icons';
import { useMobileDrawerFilterStore } from '@/hooks/use-mobile-drawer-filter-store';
import { ChipComponent } from '@/components/ui/chip-component';
import { parseJobStatusChipColor } from '@/shared/utils/parse-chip-color';
import { formatDate } from '@/shared/utils/format-date';
import { shortenEscrowAddress } from '../utils/shorten-escrow-address';
import { getJobsTableData, type MyJobs } from './my-jobs-table-service';

const parseMyJobsUniqueValues = (data: MyJobs[]) => {
  const statusSet = new Set(data.map((item) => item.status));
  const statusArray = Array.from(statusSet);
  return {
    network: [...new Set(data.map((item) => item.network))],
    jobType: [...new Set(data.flatMap((item) => item.jobType))],
    status: statusArray.length > 0 ? statusArray[0] : undefined,
  };
};

export function MyJobsTableMobile() {
  const { t } = useTranslation();
  const [searchEscrowAddress, setSearchEscrowAddress] = useState([
    {
      id: '',
      value: '',
    },
  ]);
  const { data, isLoading } = useQuery<MyJobs[]>({
    queryKey: ['example', []],
    queryFn: () => getJobsTableData(),
  });
  const [filteredData, setFilteredData] = useState(data);
  const {
    openMobileFilterDrawer,
    setMyJobsUniqueValues,
    myJobsUniqueValues,
    myJobsFilters,
  } = useMobileDrawerFilterStore();

  useEffect(() => {
    if (
      data &&
      myJobsUniqueValues.network.length === 0 &&
      myJobsUniqueValues.jobType.length === 0 &&
      myJobsUniqueValues.status.length === 0
    ) {
      setMyJobsUniqueValues(parseMyJobsUniqueValues(data));
    }

    let filtered = data;

    //filter by checkboxes
    if (myJobsFilters.network.length > 0) {
      filtered = filtered?.filter((item) =>
        myJobsFilters.network.includes(item.network)
      );
    }

    if (myJobsFilters.jobType.length > 0) {
      filtered = filtered?.filter((item) =>
        myJobsFilters.jobType.some((type) => item.jobType.includes(type))
      );
    }

    if (myJobsFilters.status.length > 0) {
      filtered = filtered?.filter((item) =>
        myJobsFilters.status.includes(item.status)
      );
    }

    // filter by search
    const escrowSearchValue = searchEscrowAddress[0].value.trim();
    if (escrowSearchValue) {
      filtered = filtered?.filter((item) =>
        item.escrowAddress.includes(escrowSearchValue)
      );
    }

    if (myJobsFilters.sortingOrder.sortingColumn) {
      const { sortingColumn, sortingOrder } = myJobsFilters.sortingOrder;

      filtered?.sort((a, b) => {
        const valueA = (a[sortingColumn as keyof MyJobs] || '').toString();
        const valueB = (b[sortingColumn as keyof MyJobs] || '').toString();

        if (sortingOrder === 'DESC') {
          return valueB.localeCompare(valueA);
        }
        return valueA.localeCompare(valueB);
      });
    }

    setFilteredData(filtered);
  }, [
    data,
    myJobsUniqueValues,
    myJobsFilters,
    searchEscrowAddress,
    setMyJobsUniqueValues,
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
                <Grid container>
                  <Grid item xs={6}>
                    <ProfileListItem
                      header={t('worker.jobs.escrowAddress')}
                      paragraph={shortenEscrowAddress(d.escrowAddress)}
                    />
                    <ProfileListItem
                      header={t('worker.jobs.expiresAt')}
                      paragraph={d.expiresAt ? formatDate(d.expiresAt) : ''}
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
                    <Typography
                      component="div"
                      sx={{
                        marginTop: '15px',
                      }}
                      variant="subtitle2"
                    >
                      {t('worker.jobs.status')}
                    </Typography>
                    <Stack
                      alignItems="center"
                      direction="row"
                      sx={{
                        marginBottom: '10px',
                      }}
                    >
                      <ChipComponent
                        backgroundColor={parseJobStatusChipColor(d.status)}
                        key={d.status}
                        label={d.status}
                      />
                    </Stack>
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
