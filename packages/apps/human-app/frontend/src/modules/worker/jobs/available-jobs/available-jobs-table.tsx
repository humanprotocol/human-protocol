import { AvailableJobsTableMobile } from '@/modules/worker/jobs/available-jobs/components/mobile';
import { AvailableJobsTableDesktop } from '@/modules/worker/jobs/available-jobs/components/desktop';
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
