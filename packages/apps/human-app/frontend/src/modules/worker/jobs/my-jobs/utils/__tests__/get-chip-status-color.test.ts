import { describe, expect, it } from 'vitest';
import type { ColorPalette } from '@/shared/styles/color-palette';
import { getChipStatusColor } from '../get-chip-status-color';
import { MyJobStatus, UNKNOWN_JOB_STATUS } from '../../../types';

describe('getChipStatusColor Function', () => {
  const mockColorPalette: ColorPalette = {
    white: '#FFFFFF',
    black: '#000000',
    backgroundColor: '#FFFFFF',
    text: {
      primary: '#320A8D',
      secondary: '#B2AFC1',
      disabled: '#CBCFE6',
      disabledSecondary: '#8494C3',
    },
    primary: {
      main: '#primary',
      light: '#primaryLight',
      dark: '#primaryDark',
      contrastText: '#FFFFFF',
      shades: '#shades',
    },
    secondary: {
      main: '#secondary',
      light: '#secondaryLight',
      dark: '#secondaryDark',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#error',
      light: '#errorLight',
      dark: '#errorDark',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#success',
      light: '#successLight',
      dark: '#successDark',
      contrastText: '#FFFFFF',
    },
    paper: {
      main: '#paper',
      light: '#paperLight',
      text: '#paperText',
      disabled: '#paperDisabled',
    },
    chip: {
      main: '#chip',
    },
    button: {
      disabled: '#buttonDisabled',
    },
    banner: {
      background: { primary: '#bannerPrimary', secondary: '#bannerSecondary' },
      text: {
        primary: '#bannerTextPrimary',
        secondary: '#bannerTextSecondary',
      },
    },
  };

  it('should return the secondary main color for ACTIVE status', () => {
    const result = getChipStatusColor(MyJobStatus.ACTIVE, mockColorPalette);
    expect(result).toBe(mockColorPalette.secondary.main);
  });

  it('should return the success main color for COMPLETED status', () => {
    const result = getChipStatusColor(MyJobStatus.COMPLETED, mockColorPalette);
    expect(result).toBe(mockColorPalette.success.main);
  });

  it('should return the error light color for VALIDATION status', () => {
    const result = getChipStatusColor(MyJobStatus.VALIDATION, mockColorPalette);
    expect(result).toBe(mockColorPalette.error.light);
  });

  it('should return the error main color for unknown status', () => {
    const result = getChipStatusColor(UNKNOWN_JOB_STATUS, mockColorPalette);
    expect(result).toBe(mockColorPalette.error.main);
  });
});
