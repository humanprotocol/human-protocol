import { type ColorPalette } from '@/shared/styles/color-palette';
import { MyJobStatus, type UNKNOWN_JOB_STATUS } from '../../types';

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
