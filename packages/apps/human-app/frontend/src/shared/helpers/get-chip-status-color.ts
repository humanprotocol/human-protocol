import { type ColorPalette } from '@/styles/color-palette';
import { MyJobStatusWithUnknown } from '@/api/services/worker/my-jobs-data';

export function getChipStatusColor(
  status: MyJobStatusWithUnknown,
  colorPalette: ColorPalette
) {
  switch (status) {
    case MyJobStatusWithUnknown.ACTIVE:
      return colorPalette.secondary.main;
    case MyJobStatusWithUnknown.COMPLETED:
      return colorPalette.success.main;
    case MyJobStatusWithUnknown.VALIDATION:
      return colorPalette.error.light;
    case MyJobStatusWithUnknown.CANCELED:
    case MyJobStatusWithUnknown.UNKNOWN:
    case MyJobStatusWithUnknown.EXPIRED:
    case MyJobStatusWithUnknown.REJECTED:
      return colorPalette.error.main;
  }
}
