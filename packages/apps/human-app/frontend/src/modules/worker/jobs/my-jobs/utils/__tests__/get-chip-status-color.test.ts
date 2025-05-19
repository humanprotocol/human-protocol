import { describe, expect, it } from 'vitest';
import { colorPalette } from '@/shared/styles/color-palette';
import { getChipStatusColor } from '../get-chip-status-color';
import { MyJobStatus, UNKNOWN_JOB_STATUS } from '../../../types';

describe('getChipStatusColor Function', () => {
  it('should return the secondary main color for ACTIVE status', () => {
    const result = getChipStatusColor(MyJobStatus.ACTIVE, colorPalette);
    expect(result).toBe(colorPalette.secondary.main);
  });

  it('should return the success main color for COMPLETED status', () => {
    const result = getChipStatusColor(MyJobStatus.COMPLETED, colorPalette);
    expect(result).toBe(colorPalette.success.main);
  });

  it('should return the error light color for VALIDATION status', () => {
    const result = getChipStatusColor(MyJobStatus.VALIDATION, colorPalette);
    expect(result).toBe(colorPalette.error.light);
  });

  it('should return the error main color for unknown status', () => {
    const result = getChipStatusColor(UNKNOWN_JOB_STATUS, colorPalette);
    expect(result).toBe(colorPalette.error.main);
  });
});
