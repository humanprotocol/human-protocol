import type { SxProps, Theme } from '@mui/material';
import { breakpoints } from '@/shared/styles/breakpoints';
import { colorPalette as constColorPalette } from '@/shared/styles/color-palette';
import { darkColorPalette as constDarkColorPalette } from '@/shared/styles/dark-color-palette';

export const commonPageCardStyles: SxProps<Theme> = {
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '20px',
  minHeight: '70vh',
  maxWidth: '1600px',
  width: '100%',
  background: constColorPalette.white,
};

export const commonDarkPageCardStyles: SxProps<Theme> = {
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '20px',
  minHeight: '70vh',
  maxWidth: '1600px',
  width: '100%',
  background: constDarkColorPalette.paper.main,
  [breakpoints.mobile]: {
    background: constDarkColorPalette.backgroundColor,
  },
};
