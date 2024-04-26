import { colorPalette } from '@/styles/color-palette';

export const parseJobStatusChipColor = (status: string) => {
  if (status === 'OVERDUE') {
    return colorPalette.error.main.toString();
  }
  if (status === 'DEACTIVATED') {
    return colorPalette.error.dark.toString();
  }
  if (status === 'COMPLITED') {
    return colorPalette.success.main.toString();
  }
  return colorPalette.primary.light.toString();
};
