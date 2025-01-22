import { AvailableJobsTableMobile } from '@/modules/worker/components/jobs/available-jobs/components/mobile/available-jobs-table-mobile';
import { AvailableJobsTableDesktop } from '@/modules/worker/components/jobs/available-jobs/components/desktop/available-jobs-table-desktop';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

interface AvailableJobsTableProps {
  handleOpenMobileFilterDrawer: () => void;
  chainIdsEnabled: number[];
}

export function AvailableJobsTable({
  handleOpenMobileFilterDrawer,
  chainIdsEnabled,
}: AvailableJobsTableProps) {
  const isMobile = useIsMobile();

  return isMobile ? (
    <AvailableJobsTableMobile
      handleOpenMobileFilterDrawer={handleOpenMobileFilterDrawer}
    />
  ) : (
    <AvailableJobsTableDesktop chainIdsEnabled={chainIdsEnabled} />
  );
}
