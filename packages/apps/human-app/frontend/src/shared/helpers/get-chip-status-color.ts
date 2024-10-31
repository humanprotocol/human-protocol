import { type ColorPalette } from '@/styles/color-palette';
import { type MyJob } from '@/api/services/worker/my-jobs-data';

export function getChipStatusColor(
  status: MyJob['status'],
  colorPalette: ColorPalette
) {
  switch (status) {
    case 'ACTIVE':
      return colorPalette.secondary.main;
    case 'COMPLETED':
      return colorPalette.success.main;
    case 'CANCELED':
    case 'UNKNOWN':
      return colorPalette.error.main;
  }
}
