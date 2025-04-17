import { useIsMobile } from '@/shared/hooks';
import { MyJobsTable } from './components/desktop';
import { MyJobsListMobile } from './components/mobile';

export function MyJobsView({ chainIdsEnabled }: { chainIdsEnabled: number[] }) {
  const isMobile = useIsMobile();

  return isMobile ? (
    <MyJobsListMobile />
  ) : (
    <MyJobsTable chainIdsEnabled={chainIdsEnabled} />
  );
}
