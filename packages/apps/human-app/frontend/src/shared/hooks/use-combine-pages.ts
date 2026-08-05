import { useMemo } from 'react';

export function useCombinePages<T>(
  tableData: { pages: { results: T[] }[] } | undefined
) {
  return useMemo(
    () => tableData?.pages.flatMap((page) => page.results) ?? [],
    [tableData?.pages]
  );
}
