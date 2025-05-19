import { SortDirection } from '../enums/collection';
import { SortDirectionDb } from '../enums/database';

export function convertToDatabaseSortDirection(
  value?: SortDirection,
): SortDirectionDb {
  const upperValue = value?.toUpperCase();

  if (
    upperValue === SortDirectionDb.ASC ||
    upperValue === SortDirectionDb.DESC
  ) {
    return upperValue as SortDirectionDb;
  }

  return SortDirectionDb.ASC;
}
