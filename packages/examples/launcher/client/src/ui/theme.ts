import { createTheme } from '@mui/material/styles';

// const font = "'Alliance No.1', sans-serif";
const font = '"Roboto","Helvetica","Arial",sans-serif';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6309ff',
      light: '#ae52d4',
      dark: '#4a148c',
    },
    info: {
      main: '#eeeeee',
      light: '#f5f5f5',
      dark: '#787383',
    },
    secondary: {
      main: 'rgb(4, 41, 122)',
      dark: 'rgb(12, 83, 183)',
      light: 'rgb(208, 242, 255)',
      contrastText: '#000',
    },
    background: {
      default: '#ffffff',
    },
    error: {
      main: 'rgb(122, 12, 46)',
      dark: 'rgb(183, 33, 54)',
      light: 'rgb(255, 231, 217)',
    },
    grey: {
      700: 'rgb(99, 115, 129)',
      500: 'rgb(223, 223, 223)',
      200: 'rgb(244, 246, 248)',
    },
    warning: {
      main: 'rgb(255, 72, 66)',
    },
    common: {
      black: '#000',
      white: '#fff',
    },
  },
  typography: {
    fontFamily: font,
    fontSize: 12,
    h1: { fontSize: 36 },
    h2: { fontSize: 24 },
    h3: { fontSize: 20 },
    h4: { fontSize: 18 },
    h5: { fontSize: 16 },
    h6: { fontSize: 14 },
    subtitle1: { fontSize: 23 },
    subtitle2: { fontSize: 19 },
    body1: { fontSize: 19 },
    body2: { fontSize: 16 },
  },
  breakpoints: {
    values: { xs: 600, sm: 800, md: 1000, lg: 1200, xl: 1536 },
  },
  components: {
    MuiInputLabel: {
      defaultProps: {
        sx: {
          fontSize: '14px',
        },
      },
    },
    MuiOutlinedInput: {
      defaultProps: {
        sx: {
          fontSize: '14px',
        },
      },
    },
  },
});

export default theme;
