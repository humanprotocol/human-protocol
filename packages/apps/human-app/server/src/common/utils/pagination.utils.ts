import _ from 'lodash';

import { SortOrder } from '../../common/enums/global-common';

export type Iteratee<T> = keyof T | ((value: T) => any);

export function paginateAndSortResults<T>(
  data: T[],
  page = 0,
  pageSize = 10,
  iteratee: Iteratee<T>,
  sortOrder = SortOrder.DESC,
): {
  results: T[];
  page: number;
  page_size: number;
  total_pages: number;
  total_results: number;
} {
  const orderedData = _.orderBy(data, iteratee, sortOrder);

  // Pagination
  const start = page * pageSize;
  const end = (page + 1) * pageSize;

  return {
    page,
    page_size: pageSize,
    total_pages: Math.ceil(data.length / pageSize),
    total_results: data.length,
    results: orderedData.slice(start, end),
  };
}
