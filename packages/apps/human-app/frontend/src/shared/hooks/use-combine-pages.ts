import { useEffect, useState } from 'react';

export function useCombinePages<T>(
  tableData: { pages: { results: T[] }[] } | undefined,
  page: number
) {
  const [allPages, setAllPages] = useState<T[]>([]);

  useEffect(() => {
    if (!tableData) return;
    const pagesFromRes = tableData.pages.flatMap((pages) => pages.results);

    if (page === 0) {
      setAllPages(pagesFromRes);
    } else {
      setAllPages((state) => [...state, ...pagesFromRes]);
    }
  }, [tableData, page]);

  return allPages;
}
