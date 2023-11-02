import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#320a8d',
      light: '#320a8d',
      dark: '#4a148c',
    },
    info: {
      main: '#eeeeee',
      light: '#f5f5f5',
      dark: '#bdbdbd',
    },
    secondary: {
      main: '#858ec6',
      light: '#6309ff',
      dark: '#00867d',
      contrastText: '#000',
    },
    text: {
      primary: '#320a8d',
      secondary: '#858ec6',
    },
    success: {
      main: '#0E976E',
    },
    warning: {
      main: '#FF9800',
    },
    error: {
      main: '#F20D5F',
    },
  },
  typography: {
    fontFamily: 'Inter',
    h2: {
      fontSize: '80px',
      lineHeight: 1.5,
      letterSpacing: '-0.5px',
      fontWeight: 800,
    },
    h4: {
      fontSize: '34px',
      fontWeight: 600,
    },
    h6: {
      fontSize: '20px',
      lineHeight: '160%',
    },
    body1: {
      fontSize: '16px',
      lineHeight: '28px',
    },
    body2: {
      fontSize: '14px',
      lineHeight: '24px',
    },
  },
  components: {
    MuiAlert: {
      styleOverrides: {
        outlinedSuccess: {
          color: '#320a8d',
          borderColor: '#320a8d',
        },
        // icon: {
        //   color: '#320a8d !important',
        // },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
        sizeLarge: {
          fontSize: '15px',
          fontWeight: '600',
          lineHeight: '24px',
          padding: '12px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          background: '#fff',
          boxShadow:
            '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '32px 20px 18px !important',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: '1px',
          },
        },
        notchedOutline: {
          borderColor: '#858ec6',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: '#320a8d',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          border: '1px solid #320a8d',
          color: '#320a8d',
          fontWeight: 600,
          fontSize: '14px',
          '&.Mui-selected': {
            background: '#320a8d',
            color: '#fff',
          },
          '&.Mui-selected:hover': {
            background: '#320a8d',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: '#f9faff',
          },
        },
      },
    },
  },
});

export default theme;
