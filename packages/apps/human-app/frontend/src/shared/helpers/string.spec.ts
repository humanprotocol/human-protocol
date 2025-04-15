import { describe, expect, it } from 'vitest';
import { faker } from '@faker-js/faker';
import { padZero } from './string';

describe('String Helper Functions', () => {
  describe('padZero', () => {
    it('should pad zero', () => {
      const paddedNumber = padZero(0);
      expect(paddedNumber).toBe(`00`);
    });

    it('should pad single digit numbers with a leading zero', () => {
      const number = faker.number.int({ min: 0, max: 9 });
      const paddedNumber = padZero(number);
      expect(paddedNumber).toBe(`0${number}`);
    });

    it('should not pad double digit numbers', () => {
      const number = faker.number.int({ min: 11, max: 999 });
      const paddedNumber = padZero(number);
      expect(paddedNumber).toBe(`${number}`);
    });

    it('should handle negative numbers according to implementation', () => {
      const number = faker.number.int({ min: -100000, max: -1 });
      const paddedNumber = padZero(number);
      expect(paddedNumber).toBe(`${number}`);
    });
  });
});
