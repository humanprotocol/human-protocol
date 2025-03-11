import { type Dispatch, type SetStateAction } from 'react';
import { useIsMobile } from '@/shared/hooks';
import { MyJobsTable } from './components/desktop';
import { MyJobsListMobile } from './components/mobile';

export function MyJobsView({
  setIsMobileFilterDrawerOpen,
  chainIdsEnabled,
}: {
  setIsMobileFilterDrawerOpen: Dispatch<SetStateAction<boolean>>;
  chainIdsEnabled: number[];
}) {
  const isMobile = useIsMobile();

  return isMobile ? (
    <MyJobsListMobile
      setIsMobileFilterDrawerOpen={setIsMobileFilterDrawerOpen}
    />
  ) : (
    <MyJobsTable chainIdsEnabled={chainIdsEnabled} />
  );
}
