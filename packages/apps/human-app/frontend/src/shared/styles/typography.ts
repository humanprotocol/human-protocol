import type { CSSProperties } from 'react';
import type { ThemeOptions } from '@mui/material';
import { breakpoints } from '@/shared/styles/breakpoints';

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    body3: true;
    body4: true;
    body5: true;
    body6: true;
    pageHeading: true;
    helperText: true;
  }
}

declare module '@mui/material/styles' {
  interface TypographyVariants {
    body3: CSSProperties;
    body4: CSSProperties;
    body5: CSSProperties;
    body6: CSSProperties;
    pageHeading: CSSProperties;
    helperText: CSSProperties;
  }

  interface TypographyVariantsOptions {
    body3?: CSSProperties;
    body4?: CSSProperties;
    body5?: CSSProperties;
    body6?: CSSProperties;
    pageHeading?: CSSProperties;
    helperText?: CSSProperties;
  }
}

export const typography: ThemeOptions['typography'] = {
  fontFamily: 'Inter, sans-serif',
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
    fontWeight: 800,
    lineHeight: 'normal',
    letterSpacing: 0,
    [breakpoints.mobile]: {
      fontSize: 20,
      fontWeight: 700,
      lineHeight: '150%',
    },
  },
  h5: {
    fontSize: 24,
    fontWeight: 400,
    letterSpacing: 0,
  },
  h6: {
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 'normal',
    letterSpacing: 0.12,
  },
  pageHeading: {
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 'normal',
    letterSpacing: 0.12,
    [breakpoints.mobile]: {
      fontSize: 16,
    },
  },
  subtitle1: {
    fontSize: 16,
    fontWeight: 400,
    letterSpacing: 0.15,
  },
  subtitle2: {
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 0.1,
  },
  body1: {
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 'normal',
    letterSpacing: 0.12,
  },
  body2: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 'normal',
    letterSpacing: 0.12,
  },
  body3: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 'normal',
    letterSpacing: 0.12,
  },
  body4: {
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 'normal',
    letterSpacing: 0.12,
  },
  body5: {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 'normal',
    letterSpacing: 0.12,
  },
  body6: {
    fontSize: 10,
    fontWeight: 400,
    fontStyle: 'italic',
    lineHeight: '1.3',
    letterSpacing: 0.15,
  },
  caption: {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: '20px',
    letterSpacing: 0.4,
  },
  helperText: {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 'normal',
    letterSpacing: 0.4,
  },
};
