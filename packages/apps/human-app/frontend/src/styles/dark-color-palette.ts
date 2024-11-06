import type { colorPalette } from '@/styles/color-palette';

export const darkColorPalette = {
  white: 'rgba(16, 7, 53, 1)',
  black: '#000000',
  backgroundColor: 'rgba(16, 7, 53, 1)',
  text: {
    primary: '#D4CFFF',
    secondary: 'rgba(212, 207, 255, 0.7)',
    disabled: 'rgba(212, 207, 255, 0.5)',
    disabledSecondary: 'rgba(147, 135, 255, 1)',
  },
  primary: {
    main: '#CDC7FF',
    light: '#EDEBFD',
    dark: '#9D7CD6',
    contrastText: 'rgba(0, 0, 0, 0.87)',
    shades: '',
  },
  secondary: {
    main: '#5D0CE9',
    dark: '#3A009F',
    light: '#BB94FF',
    contrastText: 'rgba(255, 255, 255, 0.87)',
  },
  error: {
    main: '#F65A93',
    dark: '#F3206E',
    light: '#F76DA0',
    contrastText: '#FFFFFF',
  },
  success: {
    main: '#58CAA8',
    dark: '#1F916F',
    light: '#5FD1AF',
    contrastText: 'rgba(255, 255, 255, 0.87)',
  },
  paper: {
    main: '#1c133f',
    light: '#1c133f',
    text: '#372f56CC',
    disabled: '#FBFBFE',
  },
  chip: {
    main: 'rgba(203, 207, 232, 0.28)',
  },
  button: {
    disabled: 'rgba(218, 222, 240, 0.8)',
  },
  // for 'warning', 'info' native colors from MUI were pointed as expected
  // 'info' native colors from MUI were pointed as expected
} satisfies typeof colorPalette;

// if Figma design was inconsistent for some reasons and there are extra colors for dark mode should be included in this object
export const onlyDarkModeColor = {
  backArrowBg: 'rgba(246, 247, 254, 0.1)',
  additionalTextColor: '#9387FF',
  mainColorWithOpacity: '#CDC7FFCC',
  listItemColor: '#CDC7FF29',
};
