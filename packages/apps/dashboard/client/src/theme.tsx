import { CSSProperties } from 'react';

import { Shadows, ThemeOptions } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import {
  PaletteColorOptions,
  PaletteColor,
} from '@mui/material/styles/createPalette';

import { colorPalette } from '@/assets/styles/color-palette';


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
  }
  interface PaletteOptions {
    sky?: PaletteColorOptions;
    white?: PaletteColorOptions;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    sky: true;
    white: true;
  }
}

declare module '@mui/material/IconButton' {
  interface IconButtonPropsColorOverrides {
    sky: true;
    white: true;
  }
}

declare module '@mui/material/SvgIcon' {
  interface SvgIconPropsColorOverrides {
    sky: true;
    white: true;
  }
}

const theme: ThemeOptions = createTheme({
  palette: {
    primary: {
      main: colorPalette.primary.main,
      light: colorPalette.primary.light,
    },
    info: {
      main: colorPalette.info.main,
      light: colorPalette.info.light,
      dark: colorPalette.info.dark,
    },
    secondary: {
      main: colorPalette.secondary.main,
      light: colorPalette.secondary.light,
    },
    text: {
      primary: colorPalette.primary.main,
      secondary: colorPalette.fog.main,
    },
    sky: {
      main: colorPalette.sky.main,
      light: colorPalette.sky.light,
      dark: colorPalette.sky.dark,
      contrastText: colorPalette.sky.contrastText,
    },
    white: {
      main: '#ffffff',
      light: '#ffffff',
      dark: '#f6f7fe',
      contrastText: '#ffffff',
    },
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
        tooltip: {
          backgroundColor: colorPalette.secondary.main,
          color: colorPalette.whiteSolid,
        },
        arrow: {
          color: colorPalette.secondary.main,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        sizeMedium: {
          color: colorPalette.primary.main,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          borderWidth: 2,
          color: colorPalette.primary.main,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: colorPalette.primary.main,
            borderWidth: 2,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: colorPalette.primary.main,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colorPalette.primary.main,
          },
          '& .MuiSvgIcon-root': {
            color: colorPalette.primary.main,
          },
        },
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
        root: {
          backgroundColor: colorPalette.white,
        },
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
        selectLabel: {
          '@media (max-width: 440px)': {
            gridColumn: '2 / 3',
            gridRow: '1',
            whiteSpace: 'nowrap',
            color: colorPalette.fog.main,
            justifySelf: 'end',
            marginBottom: '17px',
            position: 'relative',
            right: '-38px',
          },
          '&:focus': {
            background: 'inherit',
          },
        },
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
        root: {
          color: colorPalette.link,
          '&:hover': {
            color: `${colorPalette.linkHover}!important`,
          },
          '&:visited': {
            color: colorPalette.linkVisited,
          },
        },
      },
    },
  },
});

export default theme;
