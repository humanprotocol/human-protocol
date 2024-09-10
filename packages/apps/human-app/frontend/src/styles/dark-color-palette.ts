import type { colorPalette } from '@/styles/color-palette';

export const darkColorPalette = {
  white: 'rgba(16, 7, 53, 1)',
  black: '#000000',
  backgroundColor: 'rgba(16, 7, 53, 1)',
  text: {
    primary: 'rgba(212, 207, 255, 1)',
    secondary: 'rgba(212, 207, 255, 0.7)',
    disabled: 'rgba(212, 207, 255, 0.5)',
    disabledSecondary: 'rgba(147, 135, 255, 1)',
  },
  primary: {
    main: 'rgba(205, 199, 255, 1)',
    light: 'rgba(237, 235, 253, 1)',
    dark: 'rgba(157, 124, 214, 1)',
    contrastText: 'rgba(0, 0, 0, 0.87)',
  },
  secondary: {
    main: 'rgba(93, 12, 233, 1)',
    dark: 'rgba(58, 0, 159, 1)',
    light: 'rgba(187, 148, 255, 1)',
    contrastText: 'rgba(255, 255, 255, 0.87)',
  },
  error: {
    main: 'rgba(246, 90, 147, 1)',
    dark: 'rgba(243, 32, 110, 1)',
    light: 'rgba(247, 109, 160, 1)',
    contrastText: 'rgba(255, 255, 255, 1)',
  },
  success: {
    main: 'rgba(88, 202, 168, 1)',
    dark: 'rgba(31, 145, 111, 1)',
    light: 'rgba(95, 209, 175, 1)',
    contrastText: 'rgba(255, 255, 255, 0.87)',
  },
  paper: {
    main: 'rgb(28,19,63)',
    light: 'rgb(28,19,63)',
    text: '#CBCFE8',
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
