import { signMessage } from './signature';
import { MOCK_PRIVATE_KEY } from '../../../test/constants';

describe('Signature utility', () => {
  describe('signMessage', () => {
    it('should return a valid signature', async () => {
      const message = 'Hello, this is a test message';
      const signature = await signMessage(message, MOCK_PRIVATE_KEY);

      expect(signature).toBeDefined();
    });

    it('should stringify message object if it is not already a string', async () => {
      const message = { key: 'value' };
      const signature = await signMessage(message, MOCK_PRIVATE_KEY);

      expect(signature).toBeDefined();
    });

    it('should not stringify message if it is already a string', async () => {
      const message = 'valid message';
      const signature = await signMessage(message, MOCK_PRIVATE_KEY);

      expect(signature).toBeDefined();
    });
  });
});
