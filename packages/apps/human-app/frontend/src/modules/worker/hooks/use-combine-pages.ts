import { useEffect, useState } from 'react';

export function useCombinePages<T>(
  tableData: { pages: { results: T[] }[] } | undefined
) {
  const [allPages, setAllPages] = useState<T[]>([]);

  useEffect(() => {
    if (!tableData) return;
    const combinedPages = tableData.pages.flatMap((page) => page.results);
    setAllPages((prevState) => [...prevState, ...combinedPages]);
  }, [tableData]);

  return allPages;
}
