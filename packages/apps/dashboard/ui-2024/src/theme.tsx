import { createTheme, Theme } from '@mui/material/styles';
import { PaletteColorOptions, PaletteColor } from '@mui/material/styles/createPalette';

declare module '@mui/material/styles' {
  interface Palette {
    sky: PaletteColor;
    white: PaletteColor;
    textSecondary: PaletteColor;
  }
  interface PaletteOptions {
    sky?: PaletteColorOptions;
    white?: PaletteColorOptions;
    textSecondary?: PaletteColorOptions;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    sky: true;
    white: true;
    textSecondary: true;

  }
}

declare module '@mui/material/IconButton' {
  interface IconButtonPropsColorOverrides {
    sky: true;
    white: true;
    textSecondary: true;
  }
}

declare module '@mui/material/SvgIcon' {
  interface SvgIconPropsColorOverrides {
    sky: true;
    white: true;
    textSecondary: true;
  }
}

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
    sky: {
      main: '#858ec6',
      light: '#858ec6',
      dark: '#858ec6',
      contrastText: '#858ec6',
    },
    white: {
      main: '#fff',
      light: '#fff',
      dark: '#fff',
      contrastText: '#fff',
    },
    textSecondary: {
      main: '#858ec6',
      light: '#858ec6',
      dark: '#858ec6',
      contrastText: '#858ec6',
    },
  },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
  },
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
          '@media (min-width:1001px)': {
            paddingLeft: '56px',
            paddingRight: '56px',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#320a8d',
          color: '#fff',
        },
        arrow:{
          color: '#320a8d',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          borderWidth: 2,
          color: '#320a8d',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#320a8d',
            borderWidth: 2,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#320a8d',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#320a8d',
          },
          "& .MuiSvgIcon-root": {
            color: '#320a8d',
          },
        },
      },
    },
  },
});

export default theme;
