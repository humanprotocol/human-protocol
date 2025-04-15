import { describe, expect, it } from 'vitest';
import { shortenEscrowAddress } from './evm';

describe('EVM Helper Functions', () => {
  describe('shortenEscrowAddress', () => {
    it('should shorten a long Ethereum address with default padding', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const shortened = shortenEscrowAddress(address);
      expect(shortened).toBe('0x12345...45678');
    });

    it('should shorten a long Ethereum address with custom padding', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const shortened = shortenEscrowAddress(address, 5, 3);
      expect(shortened).toBe('0x123...678');
    });

    it('should not shorten an address that is too short', () => {
      const address = '0x12345';
      const shortened = shortenEscrowAddress(address);
      expect(shortened).toBe(address);
    });

    it('should handle empty strings', () => {
      const address = '';
      const shortened = shortenEscrowAddress(address);
      expect(shortened).toBe(address);
    });
  });
});
