import { colorPalette } from '@/styles/color-palette';

export const parseJobStatusChipColor = (status: string) => {
  if (status === 'Overdue') {
    return colorPalette.error.main.toString();
  }
  if (status === 'Deactivated') {
    return colorPalette.error.dark.toString();
  }
  if (status === 'Complited') {
    return colorPalette.success.main.toString();
  }
  return colorPalette.primary.main.toString();
};
