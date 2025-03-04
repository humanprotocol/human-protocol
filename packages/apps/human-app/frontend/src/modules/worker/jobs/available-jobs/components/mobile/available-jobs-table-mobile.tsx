import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { FiltersButtonIcon } from '@/shared/components/ui/icons';
import { AvailableJobsTableJobsListMobile } from '@/modules/worker/jobs/available-jobs/components/mobile/available-jobs-table-jobs-list-mobile';
import { useJobsFilterStore } from '../../../hooks';
import { EscrowAddressSearchForm } from '../../../components';

interface AvailableJobsTableMobileProps {
  handleOpenMobileFilterDrawer: () => void;
}

export function AvailableJobsTableMobile({
  handleOpenMobileFilterDrawer,
}: Readonly<AvailableJobsTableMobileProps>) {
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
        onClick={handleOpenMobileFilterDrawer}
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
