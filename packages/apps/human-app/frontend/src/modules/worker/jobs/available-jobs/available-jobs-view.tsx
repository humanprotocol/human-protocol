import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { AvailableJobsTableDesktop } from './components/desktop';
import { AvailableJobsTableMobile } from './components/mobile';

interface AvailableJobsTableView {
  chainIdsEnabled: number[];
}

export function AvailableJobsView({ chainIdsEnabled }: AvailableJobsTableView) {
  const isMobile = useIsMobile();

  return isMobile ? (
    <AvailableJobsTableMobile />
  ) : (
    <AvailableJobsTableDesktop chainIdsEnabled={chainIdsEnabled} />
  );
}
