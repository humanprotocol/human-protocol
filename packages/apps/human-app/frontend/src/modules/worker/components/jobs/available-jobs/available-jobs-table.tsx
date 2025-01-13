import { AvailableJobsTableMobile } from '@/modules/worker/components/jobs/available-jobs/components/mobile/available-jobs-table-mobile';
import { AvailableJobsTableDesktop } from '@/modules/worker/components/jobs/available-jobs/components/desktop/available-jobs-table-desktop';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

interface AvailableJobsTableProps {
  setIsMobileFilterDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  chainIdsEnabled: number[];
}

export function AvailableJobsTable({
  setIsMobileFilterDrawerOpen,
  chainIdsEnabled,
}: AvailableJobsTableProps) {
  const isMobile = useIsMobile();

  return isMobile ? (
    <AvailableJobsTableMobile
      setIsMobileFilterDrawerOpen={setIsMobileFilterDrawerOpen}
    />
  ) : (
    <AvailableJobsTableDesktop chainIdsEnabled={chainIdsEnabled} />
  );
}
