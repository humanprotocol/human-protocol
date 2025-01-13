import { useTranslation } from 'react-i18next';
import { type Dispatch, type SetStateAction } from 'react';
import { Button } from '@/shared/components/ui/button';
import { FiltersButtonIcon } from '@/shared/components/ui/icons';
import { useJobsFilterStore } from '@/modules/worker/hooks/use-jobs-filter-store';
import { EscrowAddressSearchForm } from '@/modules/worker/components/jobs/escrow-address-search-form';
import { AvailableJobsTableJobsListMobile } from '@/modules/worker/components/jobs/available-jobs/components/mobile/available-jobs-table-jobs-list-mobile';

interface AvailableJobsTableMobileProps {
  setIsMobileFilterDrawerOpen: Dispatch<SetStateAction<boolean>>;
}

export function AvailableJobsTableMobile({
  setIsMobileFilterDrawerOpen,
}: AvailableJobsTableMobileProps) {
  const { t } = useTranslation();
  const { setSearchEscrowAddress } = useJobsFilterStore();

  return (
    <>
      <EscrowAddressSearchForm
        columnId={t('worker.jobs.escrowAddressColumnId')}
        fullWidth
        label={t('worker.jobs.searchEscrowAddress')}
        placeholder={t('worker.jobs.searchEscrowAddress')}
        updater={setSearchEscrowAddress}
      />
      <Button
        fullWidth
        onClick={() => {
          setIsMobileFilterDrawerOpen(true);
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
      <AvailableJobsTableJobsListMobile />
    </>
  );
}
