import { useJobsFilterStore } from './use-jobs-filter-store';

interface UseFilterUpdatesOptions {
  isMobile?: boolean;
}

export function useFilterUpdates({
  isMobile = false,
}: UseFilterUpdatesOptions = {}) {
  const { setFilterParams, filterParams } = useJobsFilterStore();

  const updateFilterParams = (updates: Partial<typeof filterParams>) => {
    setFilterParams({
      ...updates,
      ...(isMobile ? { page: 0 } : {}),
    });
  };

  return {
    filterParams,
    updateFilterParams,
  };
}
