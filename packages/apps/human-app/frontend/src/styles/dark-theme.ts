import type { ThemeOptions } from '@mui/material';
import { darkColorPalette } from '@/styles/dark-color-palette';
import { typography } from '@/styles/typography';

export const darkTheme: ThemeOptions = {
  typography,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: darkColorPalette.backgroundColor,
        },
      },
    },
    MuiTypography: {
      defaultProps: {
        variant: 'body1',
        color: darkColorPalette.primary.main,
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
          paddingTop: '0.6rem',
          paddingBottom: '0.6rem',
          fontSize: '14px',
          fontWeight: 600,
          textTransform: 'none',
          '&.Mui-disabled': {
            backgroundColor: darkColorPalette.button.disabled,
            color: darkColorPalette.text.secondary,
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          '&.Mui-checked': {
            color: darkColorPalette.primary.main,
          },
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        colorPrimary: {
          fill: darkColorPalette.primary.main,
        },
        colorSecondary: {
          fill: darkColorPalette.text.disabled,
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
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: 'inherit',
          backgroundColor: darkColorPalette.white,
          boxShadow: 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px',
          color: darkColorPalette.text.primary,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        root: {
          zIndex: 50,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          borderColor: darkColorPalette.primary.main,
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          padding: '24px',
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '0 24px 24px 24px',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        gutters: {
          borderRadius: '20px',
          border: '1px',
        },
        root: {
          boxShadow: 'none',
          borderRadius: '16px !important',
          border: 'solid 1px rgba(218, 222, 240, 0.8) !important',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '20px',
        },
        root: {
          zIndex: 800,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgb(28,19,63)',
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1285,
      xl: 1536,
    },
  },
  palette: darkColorPalette,
};
