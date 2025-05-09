import {
  createTheme,
  PaletteColorOptions,
  PaletteColor,
} from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    toggleColorMode: () => void;
    isDarkMode: boolean;
  }
  interface ThemeOptions {
    toggleColorMode?: () => void;
    isDarkMode?: boolean;
  }
}

declare module '@mui/material/styles' {
  interface TypeBackground {
    grey?: string;
  }
  interface Palette {
    white: PaletteColor;
    elevation: {
      light: string;
      medium: string;
      dark: string;
    };
    link: {
      main: string;
      hover: string;
      visited: string;
    };
  }
  interface PaletteOptions {
    white?: PaletteColorOptions;
    elevation?: {
      light: string;
      medium: string;
      dark: string;
    };
    link?: {
      main: string;
      hover: string;
      visited: string;
    };
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    white: true;
  }
}

declare module '@mui/material/IconButton' {
  interface IconButtonPropsColorOverrides {
    white: true;
  }
}

declare module '@mui/material/SvgIcon' {
  interface SvgIconPropsColorOverrides {
    white: true;
  }
}

export const createAppTheme = (mode: 'light' | 'dark') => {
  const isLightMode = mode === 'light';
  return createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            primary: {
              main: '#320a8d',
              light: '#6309ff',
              contrastText: '#f9faff',
            },
            secondary: {
              main: '#6309ff',
            },
            text: {
              primary: '#320a8d',
              secondary: '#858ec6',
            },
            white: {
              main: '#ffffff',
              light: '#ffffff',
              dark: '#ffffff',
              contrastText: '#ffffff',
            },
            background: {
              default: '#ffffff',
              grey: '#f6f7fe',
            },
            backdropColor: 'rgba(240, 242, 252, 0.90)',
            link: {
              main: '#0000ee',
              hover: '#1406b2',
              visited: '#551a8b',
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
              main: '#fa2a75',
              light: '#f20d5f',
            },
          }
        : {
            primary: {
              main: '#cdc7ff',
              light: '#320a8d',
              contrastText: 'rgba(0, 0, 0, 0.87)',
            },
            secondary: {
              main: '#6309ff',
            },
            text: {
              primary: '#d4cfff',
              secondary: '#858ec6',
            },
            white: {
              main: '#ffffff',
              light: '#ffffff',
              dark: '#ffffff',
              contrastText: '#ffffff',
            },
            background: {
              default: '#1d1340',
            },
            backdropColor: 'rgba(16, 7, 53, 0.80)',
            link: {
              main: '#0000ee',
              hover: '#1406b2',
              visited: '#551a8b',
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
              main: '#fa2a75',
              light: '#f20d5f',
            },
            elevation: {
              light:
                'linear-gradient(180deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.07) 100%), #100735',
              medium:
                'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.05) 100%), #100735',
              dark: 'linear-gradient(180deg, rgba(255, 255, 255, 0.01) 0%, rgba(255, 255, 255, 0.01) 100%), #100735',
            },
          }),
    },
    typography: {
      fontFamily: 'Inter, Arial, sans-serif',
      h1: {
        fontSize: 32,
        fontWeight: 600,
      },
      h2: {
        fontSize: 34,
        fontWeight: 600,
      },
      h3: {
        fontSize: 24,
        fontWeight: 600,
      },
      h4: {
        fontSize: 20,
        fontWeight: 600,
      },
      h5: {
        fontSize: 18,
        fontWeight: 600,
      },
      h6: {
        fontSize: 20,
        fontWeight: 500,
      },
      body1: {
        fontSize: 16,
        fontWeight: 400,
      },
      body2: {
        fontSize: 14,
        fontWeight: 500,
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
        fontSize: 10,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            cursor: 'pointer',
            fontWeight: 600,
            textTransform: 'none',
            transition: 'none',

            '&:disabled': {
              backgroundColor: isLightMode
                ? '#fbfbfe'
                : 'rgba(255, 255, 255, 0.12)',
              color: isLightMode
                ? 'rgba(203, 207, 232, 0.86)'
                : 'rgba(255, 255, 255, 0.30)',
              border: 'none',
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: ({ theme }) => ({
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.white.main,
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
            borderWidth: 1,
            color: theme.palette.primary.main,
            '& .MuiOutlinedInput-notchedOutline': {
              borderWidth: 1,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
              borderWidth: 1,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
              borderWidth: 1,
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
              color: 'text.secondary',
              justifySelf: 'end',
              marginBottom: `17px`,
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
          root: ({ theme }) => ({
            textDecoration: 'none',
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
