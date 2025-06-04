import { CSSProperties } from 'react';

import { Shadows, ThemeOptions } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import {
  PaletteColorOptions,
  PaletteColor,
} from '@mui/material/styles/createPalette';

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    ['Button Small']: true;
    ['Button Large']: true;
    ['Chip']: true;
    ['Table Header']: true;
    ['Tooltip']: true;
    ['H6-Mobile']: true;
    body3: true;
  }
}

declare module '@mui/material/styles' {
  interface TypographyVariants {
    ['Button Small']: CSSProperties;
    ['Button Large']: CSSProperties;
    ['Chip']: CSSProperties;
    ['Table Header']: CSSProperties;
    ['Tooltip']: CSSProperties;
    ['H6-Mobile']: CSSProperties;
    body3: CSSProperties;
  }

  // allow configuration using `createTheme`
  interface TypographyVariantsOptions {
    ['Button Small']?: CSSProperties;
    ['Button Large']?: CSSProperties;
    ['Chip']?: CSSProperties;
    ['Table Header']?: CSSProperties;
    ['Tooltip']?: CSSProperties;
    ['H6-Mobile']: CSSProperties;
    body3?: CSSProperties;
  }
}

declare module '@mui/material/styles' {
  interface Palette {
    sky: PaletteColor;
    white: PaletteColor;
    fog: PaletteColor;
    ocean: PaletteColor;
    orange: PaletteColor;
    overlay: string;
    link: {
      main: string;
      hover: string;
      visited: string;
    };
    table: {
      main: string;
      selected: string;
      secondary: string;
    };
  }
  interface PaletteOptions {
    sky?: PaletteColorOptions;
    white?: PaletteColorOptions;
    fog?: PaletteColorOptions;
    ocean?: PaletteColorOptions;
    orange?: PaletteColorOptions;
    overlay?: string;
    link?: {
      main: string;
      hover: string;
      visited: string;
    };
    table?: {
      main: string;
      selected: string;
      secondary: string;
    };
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    sky: true;
    white: true;
    fog: true;
  }
}

declare module '@mui/material/IconButton' {
  interface IconButtonPropsColorOverrides {
    sky: true;
    white: true;
    fog: true;
  }
}

declare module '@mui/material/SvgIcon' {
  interface SvgIconPropsColorOverrides {
    sky: true;
    white: true;
    fog: true;
  }
}

const theme: ThemeOptions = createTheme({
  palette: {
    primary: {
      main: '#320a8d',
      light: '#320a8d',
    },
    secondary: {
      main: '#6309ff',
      light: '#1406B280',
      dark: '#14062b',
    },
    text: {
      primary: '#320a8d',
      secondary: '#858ec6',
    },
    info: {
      main: '#eeeeee',
      light: '#f5f5f5',
      dark: '#bdbdbd',
    },
    sky: {
      main: '#858ec6',
      light: '#858ec6',
      dark: '#dadef0cc',
      contrastText: '#858ec6',
    },
    white: {
      main: '#ffffff',
      light: '#f6f5fc',
      dark: '#f6f7fe',
      contrastText: '#f9faff',
    },
    success: {
      main: '#0ad397',
      light: '#2e7d3280',
    },
    warning: {
      main: '#ffb300',
      light: '#ffd54f',
    },
    error: {
      main: '#ffb300',
      light: '#f20d5f',
    },
    orange: {
      main: '#ed6c02',
      light: '#ed6c0280',
    },
    ocean: {
      main: '#304ffe',
      light: '#8c9eff',
      dark: '#03a9f4',
    },
    fog: {
      main: '#858ec6',
      light: '#cbcfe6',
      dark: '#e5e7f3',
    },
    link: {
      main: '#0000ee',
      hover: '#1406b2',
      visited: '#551a8b',
    },
    table: {
      main: '#ffffff01',
      selected: '#1406b21f',
      secondary: '#1406b20a',
    },
    overlay: '#1406b20a',
  },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
    h1: {
      fontSize: 32,
    },
    h2: {
      fontSize: 34,
      fontWeight: 600,
    },
    h3: {
      fontSize: 24,
      fontWeight: 600,
      '@media (max-width:600px)': {
        fontSize: 20,
      },
    },
    h4: {
      fontSize: 20,
      fontWeight: 500,
    },
    h5: {
      fontSize: 18,
      fontWeight: 600,
    },
    h6: {
      fontSize: 20,
      fontWeight: 500,
    },
    'H6-Mobile': {
      fontSize: '20px',
      fontWeight: 500,
      lineHeight: '32px',
      letterSpacing: '0.15px',
      textAlign: 'left',
    },
    body1: {
      fontSize: 16,
      fontWeight: 400,
    },
    body2: {
      fontSize: 14,
      fontWeight: 500,
    },
    body3: {
      fontSize: '12px',
      fontWeight: 400,
      lineHeight: '19.92px',
      letterSpacing: '0.4px',
      textAlign: 'left',
    },
    'Button Small': {
      fontSize: '13px',
      fontWeight: 600,
      lineHeight: '22px',
      letterSpacing: '0.1px',
      textAlign: 'left',
    },
    'Button Large': {
      fontSize: '15px',
      fontWeight: 600,
      lineHeight: '26px',
      letterSpacing: '0.1px',
      textAlign: 'left',
    },
    Chip: {
      fontSize: '13px',
      fontWeight: 400,
      lineHeight: '18px',
      letterSpacing: '0.16px',
      textAlign: 'left',
    },
    'Table Header': {
      fontFamily: 'Roboto',
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: '24px',
      letterSpacing: '0.17px',
      textAlign: 'left',
    },
    Tooltip: {
      fontSize: 10,
      fontWeight: 500,
      lineHeight: '14px',
    },
    subtitle1: {
      fontSize: 12,
    },
    subtitle2: {
      fontSize: 14,
      fontWeight: 600,
      lineHeight: '21.9px',
    },
    caption: {
      fontSize: 12,
      fontWeight: 400,
      lineHeight: 5 / 3,
      letterSpacing: 0.4,
    },
  },
  shadows: [
    ...createTheme({}).shadows.map((shadow, i) => {
      if (i === 2) {
        return '0px 3px 1px -2px #e9ebfa, 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 1px 5px 0px rgba(233, 235, 250, 0.20)';
      }
      return shadow;
    }),
  ] as Shadows,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: 'none',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          '@media (min-width:1280px)': {
            paddingX: 56,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }) => ({
          backgroundColor: theme.palette.secondary.main,
          color: theme.palette.white.light,
        }),
        arrow: ({ theme }) => ({
          color: theme.palette.secondary.main,
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        sizeMedium: ({ theme }) => ({
          color: theme.palette.primary.main,
        }),
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 4,
          borderWidth: 2,
          color: theme.palette.primary.main,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
            borderWidth: 2,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
          },
          '& .MuiSvgIcon-root': {
            color: theme.palette.primary.main,
          },
        }),
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          wordBreak: 'break-word',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.white.contrastText,
        }),
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#1406B207',
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        toolbar: {
          '@media (max-width: 440px)': {
            display: 'grid',
            gridTemplateColumns: '1fr 3fr 2fr',
            gridTemplateRows: 'auto auto',
            gridAutoFlow: 'row',
          },
        },
        selectLabel: ({ theme }) => ({
          '@media (max-width: 440px)': {
            gridColumn: '2 / 3',
            gridRow: '1',
            whiteSpace: 'nowrap',
            color: theme.palette.fog.main,
            justifySelf: 'end',
            marginBottom: '17px',
            position: 'relative',
            right: '-38px',
          },
          '&:focus': {
            background: 'inherit',
          },
        }),
        input: {
          '@media (max-width: 440px)': {
            gridColumn: '3 / 3',
            gridRow: '1',
            marginRight: '8px',
            width: '48px',
            justifySelf: 'flex-end',
          },
        },
        select: {
          '&:focus': {
            background: 'inherit',
          },
        },
        displayedRows: {
          '@media (max-width: 440px)': {
            gridColumn: '2 / 3',
            gridRow: '2',
            justifySelf: 'end',
            position: 'relative',
            right: '-12px',
          },
        },
        actions: {
          '@media (max-width: 440px)': {
            gridColumn: '3 / 3',
            gridRow: '2',
            justifySelf: 'end',
            marginLeft: 0,
            minWidth: '90px',
          },
          button: {
            marginLeft: '5px',
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.link.main,
          '&:hover': {
            color: theme.palette.link.hover,
          },
          '&:visited': {
            color: theme.palette.link.visited,
          },
        }),
      },
    },
  },
});

export default theme;
