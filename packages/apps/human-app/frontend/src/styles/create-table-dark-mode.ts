import type { MRT_Theme } from 'material-react-table';
import type { ColorPalette } from '@/styles/color-palette';

export const createTableDarkMode = (colorPalette: ColorPalette) => {
  const mrtTheme: Partial<MRT_Theme> = {
    baseBackgroundColor: colorPalette.paper.main,
  };

  return {
    mrtTheme,
    muiTablePaperProps: {
      sx: {
        boxShadow: 'none',
      },
    },
  };
};
