import { describe, expect, it } from 'vitest';
import { padZero } from '../string';

describe('String Helper Functions', () => {
  describe('padZero', () => {
    it('should pad single digit numbers with a leading zero', () => {
      expect(padZero(0)).toBe('00');
      expect(padZero(1)).toBe('01');
      expect(padZero(5)).toBe('05');
      expect(padZero(9)).toBe('09');
    });

    it('should not pad double digit numbers', () => {
      expect(padZero(10)).toBe('10');
      expect(padZero(42)).toBe('42');
      expect(padZero(99)).toBe('99');
    });

    it('should convert numbers to strings without padding for numbers >= 10', () => {
      expect(padZero(100)).toBe('100');
      expect(padZero(1000)).toBe('1000');
    });

    it('should handle negative numbers according to implementation', () => {
      expect(padZero(-1)).toBe('-1');
      expect(padZero(-9)).toBe('-9');
      expect(padZero(-10)).toBe('-10');
    });
  });
});
