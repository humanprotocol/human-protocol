export const colorPalette = {
  white: '#FFFFF',
  black: '#000000',
  text: {
    primary: '#320A8D',
    secondary: '#858EC6',
    disabled: '#CBCFE6',
  },
  primary: {
    main: '#320A8D',
    light: '#6309FF',
    dark: '#100735',
    contrastText: '#F9FAFF',
  },
  secondary: {
    main: '#6309FF',
    dark: '#4506B2',
    light: '#8409FF',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#FA2A75',
    dark: '#F20D5F',
    light: '#FF5995',
    contrastText: '#FFFFFF',
  },
  success: {
    main: '#0AD397',
    dark: '#0E976E',
    light: '#00EDA6',
    contrastText: '#FFFFFF',
  },
  // for 'warning', 'info' native colors from MUI were pointed as expected
} as const;
