import { describe, expect, it } from 'vitest';
import { faker } from '@faker-js/faker';
import { formatDate, parseDate, getTomorrowDate } from './date';

describe('Date Helper Functions', () => {
  describe('formatDate', () => {
    it('should correctly format a date string', () => {
      const dateString = faker.date.anytime().toISOString();
      const formattedDate = formatDate(dateString);
      expect(formattedDate).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('parseDate', () => {
    it('should correctly parse milliseconds into days, hours, minutes, and seconds', () => {
      // Test case: 1 day, 2 hours, 30 minutes, 15 seconds
      const milliseconds =
        1 * 24 * 60 * 60 * 1000 + // 1 day
        2 * 60 * 60 * 1000 + // 2 hours
        30 * 60 * 1000 + // 30 minutes
        15 * 1000; // 15 seconds

      const result = parseDate(milliseconds);

      expect(result.days).toBe(1);
      expect(result.hours).toBe(2);
      expect(result.minutes).toBe(30);
      expect(result.seconds).toBe(15);
    });

    it('should handle zero values correctly', () => {
      const result = parseDate(0);

      expect(result.days).toBe(0);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
      expect(result.seconds).toBe(0);
    });

    it('should throw on negative values', () => {
      const negativeMilliseconds = -1;
      expect(() => parseDate(negativeMilliseconds)).toThrow(
        'Negative values are not allowed'
      );
    });
  });

  describe('getTomorrowDate', () => {
    it('should return a date object for tomorrow', () => {
      const today = new Date();
      const tomorrow = getTomorrowDate();

      expect(tomorrow).toBeInstanceOf(Date);

      const tomorrowExpected = new Date(today);
      tomorrowExpected.setDate(tomorrowExpected.getDate() + 1);

      expect(tomorrow.getFullYear()).toBe(tomorrowExpected.getFullYear());
      expect(tomorrow.getMonth()).toBe(tomorrowExpected.getMonth());
      expect(tomorrow.getDate()).toBe(tomorrowExpected.getDate());

      expect(tomorrow.getUTCHours()).toBe(7);
      expect(tomorrow.getUTCMinutes()).toBe(0);
      expect(tomorrow.getUTCSeconds()).toBe(0);
      expect(tomorrow.getUTCMilliseconds()).toBe(0);
    });
  });
});
