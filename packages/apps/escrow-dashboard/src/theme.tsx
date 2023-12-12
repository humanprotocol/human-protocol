import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#320a8d',
      light: '#320a8d',
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
      lineHeight: '123.5%',
      letterSpacing: '0.25px',
      '@media (max-width: 576px)': {
        fontSize: '28px',
      },
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
          paddingTop: '8px',
          paddingBottom: '8px',
          fontWeight: 600,
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
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
        },
        notchedOutline: {
          border: '1px solid #320a8d',
        },
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        focusHighlight: {
          backgroundColor: '#1406b2',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(20, 6, 178, 0.08)',
          },
        },
      },
    },
  },
});

export default theme;
