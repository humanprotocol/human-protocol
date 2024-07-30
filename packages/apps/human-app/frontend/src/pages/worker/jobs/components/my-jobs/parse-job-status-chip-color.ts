import { colorPalette } from '@/styles/color-palette';

export const parseJobStatusChipColor = (status: string) => {
  if (status === 'OVERDUE') {
    return colorPalette.error.main;
  }
  if (status === 'DEACTIVATED') {
    return colorPalette.error.dark;
  }
  if (status === 'COMPLETED') {
    return colorPalette.success.main;
  }
  return colorPalette.primary.light;
};
