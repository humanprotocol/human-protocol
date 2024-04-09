import type { CSSProperties } from 'react';
import type { ThemeOptions } from '@mui/material';
import { colorPalette } from '@/styles/color-palette';

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    text_field: true;
  }
}

declare module '@mui/material/styles' {
  interface TypographyVariants {
    text_field: CSSProperties;
  }

  // allow configuration using `createTheme`
  interface TypographyVariantsOptions {
    text_field?: CSSProperties;
  }
}

export const theme: ThemeOptions = {
  typography: {
    h1: {
      fontSize: 56,
      fontWeight: 500,
    },
    h2: {
      fontSize: 36,
      fontWeight: 500,
    },
    h3: {
      fontSize: 28,
      fontWeight: 700,
    },
    h4: {
      fontSize: 24,
      fontWeight: 500,
    },
    h5: {
      fontSize: 20,
      fontWeight: 500,
    },
    text_field: {
      fontSize: 16,
    },
    body1: {
      fontSize: 14,
    },
    body2: {
      fontSize: 14,
      fontWeight: 500,
    },
    subtitle1: {
      fontSize: 12,
    },
    subtitle2: {
      fontSize: 12,
      fontWeight: 500,
    },
  },
  components: {
    MuiTypography: {
      defaultProps: {
        variant: 'body1',
        color: colorPalette.ink.main,
        fontFamily: 'Roboto',
        variantMapping: {
          subtitle1: 'p',
          subtitle2: 'p',
          text_field: 'p',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: '14px',
          fontWeight: 500,
          '&.Mui-disabled': {
            backgroundColor: colorPalette.ink.light,
            color: colorPalette.white,
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          '&.Mui-checked': {
            color: colorPalette.ink.main,
          },
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          fill: colorPalette.primary.main,
        },
      },
    },
  },
  palette: {
    primary: {
      main: colorPalette.primary.main,
      light: colorPalette.primary.light,
      contrastText: colorPalette.white,
    },
    secondary: {
      main: colorPalette.pale.main,
      light: colorPalette.pale.light,
      contrastText: colorPalette.white,
    },
    error: {
      main: colorPalette.error.main,
      light: colorPalette.error.light,
      dark: colorPalette.error.dark,
    },
    success: {
      main: colorPalette.success.main,
      light: colorPalette.success.light,
    },
  },
};
