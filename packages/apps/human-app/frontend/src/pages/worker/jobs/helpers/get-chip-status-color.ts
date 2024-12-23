import {
  MyJobStatus,
  type UNKNOWN_JOB_STATUS,
} from '@/api/services/worker/my-jobs-data';
import { type ColorPalette } from '@/styles/color-palette';

export function getChipStatusColor(
  status: MyJobStatus | typeof UNKNOWN_JOB_STATUS,
  colorPalette: ColorPalette
) {
  switch (status) {
    case MyJobStatus.ACTIVE:
      return colorPalette.secondary.main;
    case MyJobStatus.COMPLETED:
      return colorPalette.success.main;
    case MyJobStatus.VALIDATION:
      return colorPalette.error.light;
    default:
      return colorPalette.error.main;
  }
}
