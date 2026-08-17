import {
  createTheme,
  PaletteColorOptions,
  type PaletteMode,
} from '@mui/material';
import { typography } from '@/shared/styles/typography';

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    accent: true;
  }
}

declare module '@mui/material/Radio' {
  interface RadioPropsColorOverrides {
    accent: true;
  }
}

declare module '@mui/material/styles' {
  interface Palette {
    accent: PaletteColor;
    border: PaletteColor;
    button: {
      disabled: string;
    };
  }
  interface PaletteOptions {
    accent: PaletteColorOptions;
    border: PaletteColorOptions;
    button: {
      disabled?: string;
    };
  }
  interface PaletteColor {
    strong?: string;
    disabled?: string;
  }
  interface SimplePaletteColorOptions {
    strong?: string;
    disabled?: string;
  }
  interface TypeText {
    muted?: string;
    subtle?: string;
    light?: string;
    auxiliary100?: string;
    auxiliary200?: string;
  }
  interface TypeBackground {
    subtle: string;
    light: string;
  }
}

export const createAppTheme = (mode: PaletteMode) => {
  return createTheme({
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1285,
        xl: 1536,
      },
    },
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            primary: {
              main: '#320a8d',
              light: '#6309ff',
              dark: '#100735',
              contrastText: '#f9faff',
            },
            secondary: {
              main: '#6309ff',
              dark: '#4506b2',
              light: '#8409ff',
              contrastText: '#ffffff',
            },
            text: {
              primary: '#320a8d',
              secondary: '#b2afc1',
              light: '#6309ff',
              disabled: '#cbcfe6',
              auxiliary100: '#000000',
              auxiliary200: '#676767',
            },
            background: {
              default: '#f6f7fe',
              paper: '#ffffff',
              subtle: '#fcfcfc',
              light: '#f6f7ff',
            },
            accent: {
              main: '#fa2a75',
              dark: '#af1d51',
              contrastText: '#ffffff',
            },
            border: {
              main: '#d9d9d9',
              strong: 'rgba(50, 10, 141, 0.30)',
            },
            error: {
              main: '#ff6262',
              dark: '#ff6262cc',
              contrastText: '#ffffff',
            },
            success: {
              main: '#43ba96',
              dark: '#43ba96cc',
              contrastText: '#ffffff',
            },
            button: {
              disabled: '#e6e7ef',
            },
          }
        : {
            primary: {
              main: '#cdc7ff',
              light: '#edebfd',
              dark: '#9d7cd6',
              contrastText: 'rgba(0, 0, 0, 0.87)',
            },
            secondary: {
              main: '#5d0ce9',
              dark: '#3a009f',
              light: '#bb94ff',
              contrastText: 'rgba(255, 255, 255, 0.87)',
            },
            text: {
              primary: '#d4cfff',
              secondary: 'rgba(212, 207, 255, 0.70)',
              light: '#9387ff',
              disabled: 'rgba(212, 207, 255, 0.5)',
              auxiliary100: '#ffffff',
              auxiliary200: '#a0a0a0',
            },
            background: {
              default: '#100735',
              paper: '#251d47',
              subtle: '#2d284e',
              light: '#1c133f',
            },
            accent: {
              main: '#fa2a75',
              dark: '#af1d51',
              contrastText: '#ffffff',
            },
            border: {
              main: 'rgba(255, 255, 255, 0.07)',
              strong: '#3a2e6f',
            },
            error: {
              main: '#ff6262',
              dark: '#ff6262cc',
              contrastText: '#ffffff',
            },
            success: {
              main: '#43ba96',
              dark: '#43ba96cc',
              contrastText: '#ffffff',
            },
            button: {
              disabled: '#ffffff1f',
            },
          }),
    },
    typography,
    components: {
      MuiTypography: {
        defaultProps: {
          variant: 'body1',
          color: 'primary.main',
          variantMapping: {
            body5: 'p',
            subtitle1: 'p',
            subtitle2: 'p',
            pageHeading: 'h1',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            pt: '10px',
            pb: '10px',
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
            '&.Mui-disabled': {
              bgcolor: theme.palette.button.disabled,
              color: theme.palette.text.disabled,
            },
          }),
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontSize: '14px',
            fontWeight: 500,
            lineHeight: 'normal',
            letterSpacing: '0.12px',
            borderRadius: '99px',
            border: '0.5px solid',
            width: 'fit-content',
            transition: 'none',
          },
        },
      },
      MuiSvgIcon: {
        styleOverrides: {
          colorPrimary: ({ theme }) => ({
            fill: theme.palette.primary.main,
          }),
          colorSecondary: ({ theme }) => ({
            fill: theme.palette.text.disabled,
          }),
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: ({ theme }) => ({
            fontSize: 'inherit',
            backgroundColor: theme.palette.background.default,
            boxShadow: 'rgba(99, 99, 99, 0.2) 0px 2px 2px 0px',
            color: theme.palette.text.primary,
          }),
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => {
            const isDarkMode = theme.palette.mode === 'dark';
            const borderColor = isDarkMode
              ? theme.palette.text.auxiliary200
              : theme.palette.text.auxiliary200;
            return {
              color: theme.palette.text.auxiliary100,
              fontWeight: 400,
              '&:hover fieldset': {
                borderColor: borderColor,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: borderColor,
              },
            };
          },
          notchedOutline: ({ theme }) => ({
            borderColor: theme.palette.text.auxiliary200,
            fontWeight: 400,
          }),
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.auxiliary200,
            fontWeight: 400,
            '&.Mui-focused': {
              color: theme.palette.text.auxiliary100,
            },
          }),
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
          root: ({ theme }) => {
            const isDarkMode = theme.palette.mode === 'dark';
            return {
              boxShadow: 'none',
              borderRadius: '16px !important',
              border: isDarkMode
                ? '1px solid rgba(255, 255, 255, 0.12) !important'
                : '1px solid rgba(218, 222, 240, 0.8) !important',
            };
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
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottomColor: 'none !important',
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: ({ theme }) => ({
            color: theme.palette.text.secondary,
          }),
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            transform: 'scale(1,1)',
          },
        },
      },
    },
  });
};
