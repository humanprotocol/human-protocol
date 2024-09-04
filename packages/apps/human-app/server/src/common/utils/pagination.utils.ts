import { SortOrder } from '../../common/enums/global-common';

export function paginateAndSortResults<T>(
  data: T[],
  page = 0,
  pageSize = 10,
  sortField: keyof T | undefined = 'created_at' as keyof T,
  sortOrder = SortOrder.DESC,
): {
  results: T[];
  page: number;
  page_size: number;
  total_pages: number;
  total_results: number;
} {
  let results = data;

  // Sorting
  if (!sortField) {
    sortField = 'created_at' as keyof T;
  }
  results = results.sort((a, b) => {
    if (sortOrder === SortOrder.DESC) {
      return a[sortField] < b[sortField] ? 1 : -1;
    } else {
      return a[sortField] > b[sortField] ? 1 : -1;
    }
  });

  // Pagination
  const start = page * pageSize;
  const end = (page + 1) * pageSize;

  return {
    page,
    page_size: pageSize,
    total_pages: Math.ceil(data.length / pageSize),
    total_results: data.length,
    results: results.slice(start, end),
  };
}
