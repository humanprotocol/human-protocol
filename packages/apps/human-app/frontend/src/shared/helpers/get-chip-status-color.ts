import { colorPalette as lightModeColorPalette } from '@/styles/color-palette';
import { type MyJob } from '@/api/services/worker/my-jobs-data';

export function getChipStatusColor(status: MyJob['status']) {
  switch (status) {
    case 'ACTIVE':
      return lightModeColorPalette.primary.light;
    case 'COMPLETED':
      return lightModeColorPalette.success.main;
    case 'CANCELED':
    case 'UNKNOWN':
      return lightModeColorPalette.error.main;
  }
}
