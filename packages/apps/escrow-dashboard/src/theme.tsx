import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#320a8d',
      light: '#320a8d',
      dark: '#100735',
    },
    info: {
      main: '#eeeeee',
      light: '#f5f5f5',
      dark: '#bdbdbd',
    },
    secondary: {
      main: '#6309ff',
      light: '#14062b',
    },
    text: {
      primary: '#320a8d',
      secondary: '#858ec6',
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
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        scrollButtons: {
          '&.Mui-disabled': {
            opacity: 0.3,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

export default theme;
