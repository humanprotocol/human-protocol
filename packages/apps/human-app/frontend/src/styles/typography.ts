import type { CSSProperties } from 'react';
import type { ThemeOptions } from '@mui/material';
import { breakpoints } from '@/styles/breakpoints';

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    textField: true;
    body3: true;
    body4: true;
    body5: true;
    body6: true;
    body7: true;
    body8: true;
    buttonLarge: true;
    buttonMedium: true;
    buttonSmall: true;
    inputLabel: true;
    helperText: true;
    avatarLetter: true;
    inputText: true;
    tooltip: true;
    inputUnderline: true;
    chip: true;
    mobileHeaderLarge: true;
    mobileHeaderMid: true;
  }
}

declare module '@mui/material/styles' {
  interface TypographyVariants {
    textField: CSSProperties;
    body3: CSSProperties;
    body4: CSSProperties;
    body5: CSSProperties;
    body6: CSSProperties;
    body7: CSSProperties;
    body8: CSSProperties;
    buttonLarge: CSSProperties;
    buttonMedium: CSSProperties;
    buttonSmall: CSSProperties;
    inputLabel: CSSProperties;
    helperText: CSSProperties;
    avatarLetter: CSSProperties;
    inputText: CSSProperties;
    tooltip: CSSProperties;
    inputUnderline: CSSProperties;
    chip: CSSProperties;
    mobileHeaderLarge: CSSProperties;
    mobileHeaderMid: CSSProperties;
  }

  interface TypographyVariantsOptions {
    textField?: CSSProperties;
    body3?: CSSProperties;
    body4?: CSSProperties;
    body5?: CSSProperties;
    body6?: CSSProperties;
    body7?: CSSProperties;
    body8?: CSSProperties;
    buttonLarge?: CSSProperties;
    buttonMedium?: CSSProperties;
    buttonSmall?: CSSProperties;
    inputLabel?: CSSProperties;
    helperText?: CSSProperties;
    avatarLetter?: CSSProperties;
    inputText?: CSSProperties;
    tooltip?: CSSProperties;
    inputUnderline?: CSSProperties;
    chip?: CSSProperties;
    mobileHeaderLarge?: CSSProperties;
    mobileHeaderMid?: CSSProperties;
  }
}

export const typography: ThemeOptions['typography'] = {
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
  body6: {
    fontSize: 24,
    fontWeight: 600,
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
  chip: {
    fontSize: 13,
    fontWeight: 400,
    letterSpacing: 0.16,
  },
};
