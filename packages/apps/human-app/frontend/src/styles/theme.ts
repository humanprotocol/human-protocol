import type { CSSProperties } from 'react';
import type { ThemeOptions } from '@mui/material';
import { colorPalette } from '@/styles/color-palette';

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    textField: true;
    body3: true;
    buttonLarge: true;
    buttonMedium: true;
    buttonSmall: true;
    inputLabel: true;
    helperText: true;
    avatarLetter: true;
    inputText: true;
    tooltip: true;
    inputUnderline: true;
  }
}

declare module '@mui/material/styles' {
  interface TypographyVariants {
    textField: CSSProperties;
    body3: CSSProperties;
    buttonLarge: CSSProperties;
    buttonMedium: CSSProperties;
    buttonSmall: CSSProperties;
    inputLabel: CSSProperties;
    helperText: CSSProperties;
    avatarLetter: CSSProperties;
    inputText: CSSProperties;
    tooltip: CSSProperties;
    inputUnderline: CSSProperties;
  }

  // allow configuration using `createTheme`
  interface TypographyVariantsOptions {
    textField?: CSSProperties;
    body3?: CSSProperties;
    buttonLarge?: CSSProperties;
    buttonMedium?: CSSProperties;
    buttonSmall?: CSSProperties;
    inputLabel?: CSSProperties;
    helperText?: CSSProperties;
    avatarLetter?: CSSProperties;
    inputText?: CSSProperties;
    tooltip?: CSSProperties;
    inputUnderline?: CSSProperties;
  }
}

const breakpoints = {
  mobile: '@media (max-width:900px)',
};

export const theme: ThemeOptions = {
  typography: {
    h1: {
      fontSize: 80,
      fontWeight: 800,
      letterSpacing: -0.5,
      [breakpoints.mobile]: {
        fontSize: 40,
      },
    },
    h2: {
      fontSize: 60,
      fontWeight: 600,
      letterSpacing: -0.5,
      [breakpoints.mobile]: {
        fontSize: 36,
      },
    },
    h3: {
      fontSize: 48,
      fontWeight: 400,
      letterSpacing: 0,
      [breakpoints.mobile]: {
        fontSize: 20,
        fontWeight: 500,
        letterSpacing: 0.15,
      },
    },
    h4: {
      fontSize: 34,
      fontWeight: 600,
      letterSpacing: 0.25,
      [breakpoints.mobile]: {
        fontSize: 20,
        fontWeight: 500,
        letterSpacing: 0.15,
      },
    },
    h5: {
      fontSize: 24,
      fontWeight: 400,
      letterSpacing: 0,
      [breakpoints.mobile]: {
        fontSize: 24,
      },
    },
    h6: {
      fontSize: 20,
      fontWeight: 500,
      letterSpacing: 0.15,
      [breakpoints.mobile]: {
        fontSize: 20,
      },
    },
    subtitle1: {
      fontSize: 16,
      fontWeight: 400,
      letterSpacing: 0.15,
      [breakpoints.mobile]: {
        fontSize: 16,
      },
    },
    subtitle2: {
      fontSize: 14,
      fontWeight: 600,
      letterSpacing: 0.1,
      [breakpoints.mobile]: {
        fontSize: 14,
      },
    },
    body1: {
      fontSize: 16,
      fontWeight: 400,
      letterSpacing: 0.15,
      [breakpoints.mobile]: {
        fontSize: 16,
      },
    },
    body2: {
      fontSize: 14,
      fontWeight: 400,
      letterSpacing: 0.15,
      [breakpoints.mobile]: {
        fontSize: 14,
      },
    },
    body3: {
      fontSize: 16,
      fontWeight: 500,
      letterSpacing: 0.15,
    },
    buttonLarge: {
      fontSize: 15,
      fontWeight: 600,
      letterSpacing: 0.1,
    },
    buttonMedium: {
      fontSize: 14,
      fontWeight: 600,
      letterSpacing: 0.1,
    },
    buttonSmall: {
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: 0.1,
    },
    caption: {
      fontSize: 12,
      fontWeight: 400,
      letterSpacing: 0.4,
    },
    overline: {
      fontSize: 12,
      fontWeight: 400,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    avatarLetter: {
      fontSize: 20,
      fontWeight: 400,
      letterSpacing: 0.14,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: 400,
      letterSpacing: 0.15,
    },
    helperText: {
      fontSize: 12,
      fontWeight: 400,
      letterSpacing: 0.4,
    },
    inputText: {
      fontSize: 16,
      fontWeight: 400,
      letterSpacing: 0.15,
    },
    tooltip: {
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: 0,
    },
    inputUnderline: {
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: 0.15,
      textDecoration: 'underline',
    },
  },
  components: {
    MuiTypography: {
      defaultProps: {
        variant: 'body1',
        color: colorPalette.primary.main,
        fontFamily: 'Inter',
        variantMapping: {
          subtitle1: 'p',
          subtitle2: 'p',
          textField: 'p',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: '14px',
          fontWeight: 500,
          '&.Mui-disabled': {
            backgroundColor: colorPalette.primary.contrastText,
            color: colorPalette.text.secondary,
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          '&.Mui-checked': {
            color: colorPalette.primary.main,
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
    MuiTableHead: {
      styleOverrides: {
        root: {
          cursor: 'pointer',
        },
      },
    },
  },
  palette: colorPalette,
};
