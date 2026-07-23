import type { CSSProperties } from 'react';
import type { ThemeOptions } from '@mui/material';
import { breakpoints } from '@/shared/styles/breakpoints';

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    body4: true;
    body5: true;
    body7: true;
    body8: true;
    buttonLarge: true;
    buttonMedium: true;
    helperText: true;
    chip: true;
    mobileHeaderLarge: true;
    mobileHeaderMid: true;
  }
}

declare module '@mui/material/styles' {
  interface TypographyVariants {
    textField: CSSProperties;
    body4: CSSProperties;
    body5: CSSProperties;
    body7: CSSProperties;
    body8: CSSProperties;
    buttonLarge: CSSProperties;
    buttonMedium: CSSProperties;
    helperText: CSSProperties;
    chip: CSSProperties;
    mobileHeaderLarge: CSSProperties;
    mobileHeaderMid: CSSProperties;
  }

  interface TypographyVariantsOptions {
    textField?: CSSProperties;
    body4?: CSSProperties;
    body5?: CSSProperties;
    body7?: CSSProperties;
    body8?: CSSProperties;
    buttonLarge?: CSSProperties;
    buttonMedium?: CSSProperties;
    helperText?: CSSProperties;
    chip?: CSSProperties;
    mobileHeaderLarge?: CSSProperties;
    mobileHeaderMid?: CSSProperties;
  }
}

export const typography: ThemeOptions['typography'] = {
  fontFamily: 'Inter',
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
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: 0.15,
    },
  },
  mobileHeaderLarge: {
    fontSize: 26,
    fontWeight: 500,
    letterSpacing: 0.15,
  },
  h5: {
    fontSize: 24,
    fontWeight: 400,
    letterSpacing: 0,
    [breakpoints.mobile]: {
      fontSize: 24,
    },
  },
  mobileHeaderMid: {
    fontSize: 22,
    fontWeight: 500,
    letterSpacing: 0.58,
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
  },
  body2: {
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: 0.15,
    [breakpoints.mobile]: {
      fontSize: 14,
    },
  },
  body4: {
    fontSize: 24,
    fontWeight: 600,
    letterSpacing: 0.15,
  },
  body5: {
    fontSize: 20,
    fontWeight: 500,
    letterSpacing: 0.15,
  },
  body7: {
    fontSize: 18,
    fontWeight: 500,
    letterSpacing: 0.15,
  },
  body8: {
    fontSize: 10,
    fontWeight: 400,
    fontStyle: 'italic',
    lineHeight: '0.1rem',
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
  caption: {
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: 0.4,
  },
  helperText: {
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: 0.4,
  },
  chip: {
    fontSize: 13,
    fontWeight: 400,
    letterSpacing: 0.16,
  },
};
