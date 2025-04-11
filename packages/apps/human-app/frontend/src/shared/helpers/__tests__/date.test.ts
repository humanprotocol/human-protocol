import { describe, expect, it } from 'vitest';
import { formatDate, parseDate, getTomorrowDate } from '../date';

describe('Date Helper Functions', () => {
  describe('formatDate', () => {
    it('should correctly format a date string', () => {
      const dateString = '2023-01-15T12:30:45Z';
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
  });

  describe('getTomorrowDate', () => {
    it('should return a date object for tomorrow', () => {
      const today = new Date();
      const tomorrow = getTomorrowDate();

      expect(tomorrow).toBeInstanceOf(Date);

      const diffTime = tomorrow.getTime() - today.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      expect(diffDays).toBeCloseTo(1, 0);
    });
  });
});
