import type { MRT_Theme } from 'material-react-table';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import type { ColorPalette } from '@/styles/color-palette';

export const createTableDarkMode = (colorPalette: ColorPalette) => {
  const mrtTheme: Partial<MRT_Theme> = {
    baseBackgroundColor: colorPalette.paper.main,
  };

  return {
    icons: {
      ChevronLeftIcon: () => {
        return <ChevronLeftIcon sx={{ fill: colorPalette.text.primary }} />;
      },
      ChevronRightIcon: () => {
        return (
          <ChevronLeftIcon
            sx={{
              fill: colorPalette.text.primary,
              transform: 'rotate(180deg)',
            }}
          />
        );
      },
      FirstPageIcon: () => {
        return <FirstPageIcon sx={{ fill: colorPalette.text.primary }} />;
      },
      LastPageIcon: () => {
        return (
          <FirstPageIcon
            sx={{
              fill: colorPalette.text.primary,
              transform: 'rotate(180deg)',
            }}
          />
        );
      },
    },
    mrtTheme,
    muiTablePaperProps: {
      sx: {
        boxShadow: 'none',
      },
    },
  };
};
