import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { AvailableJobsTableDesktop } from './components/desktop';
import { AvailableJobsTableMobile } from './components/mobile';

interface AvailableJobsTableView {
  handleOpenMobileFilterDrawer: () => void;
  chainIdsEnabled: number[];
}

export function AvailableJobsView({
  handleOpenMobileFilterDrawer,
  chainIdsEnabled,
}: AvailableJobsTableView) {
  const isMobile = useIsMobile();

  return isMobile ? (
    <AvailableJobsTableMobile
      handleOpenMobileFilterDrawer={handleOpenMobileFilterDrawer}
    />
  ) : (
    <AvailableJobsTableDesktop chainIdsEnabled={chainIdsEnabled} />
  );
}
