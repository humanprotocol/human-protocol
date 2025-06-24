import { CSSProperties } from 'react';

import { Shadows } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import {
  PaletteColorOptions,
  PaletteColor,
} from '@mui/material/styles/createPalette';

import { lightPalette, darkPalette } from './palette';

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    tooltip: true;
    body3: true;
  }
}

declare module '@mui/material/styles' {
  interface Theme {
    toggleColorMode: () => void;
    isDarkMode: boolean;
  }
  interface ThemeOptions {
    toggleColorMode?: () => void;
    isDarkMode?: boolean;
  }
  interface TypographyVariants {
    tooltip: CSSProperties;
    body3: CSSProperties;
  }
  interface TypographyVariantsOptions {
    tooltip?: CSSProperties;
    body3?: CSSProperties;
  }
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

export const createAppTheme = (mode: 'light' | 'dark') => {
  return createTheme({
    palette: {
      mode,
      ...(mode === 'light' ? lightPalette : darkPalette),
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
        lineHeight: '150%',
        '@media (max-width:900px)': {
          fontSize: 20,
          fontWeight: 500,
          lineHeight: '160%',
          letterSpacing: '0.15px',
        },
      },
      h4: {
        fontSize: 20,
        fontWeight: 500,
      },
      h5: {
        fontSize: 18,
        fontWeight: 600,
        lineHeight: '160%',
        letterSpacing: '0.15px',
      },
      h6: {
        fontSize: 20,
        fontWeight: 500,
      },
      body1: {
        fontSize: 16,
        fontWeight: 400,
        lineHeight: '150%',
        letterSpacing: '0.15px',
      },
      body2: {
        fontSize: 14,
        fontWeight: 400,
        lineHeight: '20px',
        letterSpacing: '0.17px',
      },
      body3: {
        fontSize: '12px',
        fontWeight: 400,
        lineHeight: '19.92px',
        letterSpacing: '0.4px',
      },
      subtitle1: {
        fontSize: 16,
        fontWeight: 400,
        lineHeight: '175%',
        letterSpacing: '0.15px',
      },
      subtitle2: {
        fontSize: 14,
        fontWeight: 600,
        lineHeight: '21.9px',
        letterSpacing: '0.1px',
      },
      caption: {
        fontSize: 12,
        fontWeight: 400,
        lineHeight: 5 / 3,
        letterSpacing: 0.4,
      },
      tooltip: {
        fontSize: 10,
        fontWeight: 500,
        lineHeight: '14px',
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
            letterSpacing: '0.1px',
            textTransform: 'none',
          },
          sizeSmall: {
            padding: '4px 10px',
            fontSize: '13px',
            lineHeight: '22px',
          },
          sizeMedium: {
            padding: '6px 16px',
            fontSize: '14px',
            lineHeight: '24px',
          },
          sizeLarge: {
            padding: '8px 22px',
            fontSize: '15px',
            lineHeight: '26px',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            padding: '4px',
            borderRadius: 16,
          },
          label: {
            fontFamily: 'Roboto',
            padding: '3px 6px',
            fontSize: '13px',
            lineHeight: '18px',
            letterSpacing: '0.16px',
            fontWeight: 400,
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
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-root': {
              fontFamily: 'Roboto',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: '24px',
              letterSpacing: '0.17px',
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
};
