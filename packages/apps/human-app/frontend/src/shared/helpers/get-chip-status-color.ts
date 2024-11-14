import { type ColorPalette } from '@/styles/color-palette';

export function getChipStatusColor(status: string, colorPalette: ColorPalette) {
  const normalizedStatus = status.toUpperCase();

  switch (normalizedStatus) {
    case 'ACTIVE':
      return colorPalette.secondary.main;
    case 'COMPLETED':
      return colorPalette.success.main;
    case 'VALIDATION':
      return colorPalette.error.light;
    default:
      return colorPalette.error.main;
  }
}
