import { verifySignature, recoverSigner, signMessage } from './signature';
import {
  MOCK_ADDRESS,
  MOCK_FILE_URL,
  MOCK_WEB3_PRIVATE_KEY,
} from '../../../test/constants';
import { ChainId } from '@human-protocol/sdk';
import { WebhookDto } from '@/modules/webhook/webhook.dto';
import { EventType } from '../enums/webhook';

jest.doMock('ethers', () => {
  return {
    utils: {
      get verifyMessage() {
        return jest.fn((message, signature) => {
          if (message === 'valid-message' && signature === 'valid-signature') {
            return 'recovered-address';
          } else {
            throw new Error('Invalid signature');
          }
        });
      },
    },
  };
});

describe('Signature utility', () => {
  describe('verifySignature', () => {
    it('should return true for valid signature', async () => {
      const message = 'Hello, this is a signed message!';
      const signature = await signMessage(message, MOCK_WEB3_PRIVATE_KEY);

      const result = verifySignature(message, signature, [MOCK_ADDRESS]);

      expect(result).toBe(true);
    });

    it('should throw conflict exception for signature not verified', async () => {
      const message = 'Hello, this is a signed message!';

      const invalidSignature = await signMessage(
        message,
        MOCK_WEB3_PRIVATE_KEY,
      );
      const invalidAddress = '0x1234567890123456789012345678901234567892';

      expect(() => {
        verifySignature(message, invalidSignature, [invalidAddress]);
      }).toThrow('Signature not verified');
    });

    it('should throw conflict exception for invalid signature', () => {
      const message = 'Hello, this is a signed message!';
      const invalidSignature = '0xInvalidSignature';

      expect(() => {
        verifySignature(message, invalidSignature, [MOCK_ADDRESS]);
      }).toThrow('Invalid signature');
    });

    it('should return true for valid WebhookDto signature', async () => {
      const webhookDto: WebhookDto = {
        chainId: ChainId.LOCALHOST,
        escrowAddress: '0x1234567890123456789012345678901234567890',
        eventType: EventType.ESCROW_COMPLETED,
        eventData: { solutionsUrl: MOCK_FILE_URL },
      };

      const messageString = JSON.stringify({
        ...webhookDto,
        escrowAddress: webhookDto.escrowAddress.toLowerCase(),
      });
      const signature = await signMessage(messageString, MOCK_WEB3_PRIVATE_KEY);

      const result = verifySignature(webhookDto, signature, [MOCK_ADDRESS]);

      expect(result).toBe(true);
    });
  });

  describe('recoverSigner', () => {
    it('should recover the correct signer', async () => {
      const message = 'value';
      const signature = await signMessage(message, MOCK_WEB3_PRIVATE_KEY);

      const result = recoverSigner(message, signature);

      expect(result).toBe(MOCK_ADDRESS);
    });

    it('should throw conflict exception for invalid signature', () => {
      const message = 'Hello, this is a signed message!';
      const invalidSignature = '0xInvalidSignature';

      expect(() => {
        recoverSigner(message, invalidSignature);
      }).toThrow('Invalid signature');
    });

    it('should stringify message object if it is not already a string', async () => {
      const message = { key: 'value' };
      const signature = await signMessage(message, MOCK_WEB3_PRIVATE_KEY);

      const recoveredAddress = recoverSigner(message, signature);

      expect(recoveredAddress).toBe(MOCK_ADDRESS);
    });

    it('should not stringify message if it is already a string', async () => {
      const message = 'valid message';
      const signature = await signMessage(message, MOCK_WEB3_PRIVATE_KEY);

      const recoveredAddress = recoverSigner(message, signature);

      expect(recoveredAddress).toBe(MOCK_ADDRESS);
    });
  });

  describe('signMessage', () => {
    it('should return a valid signature', async () => {
      const message = 'Hello, this is a test message';
      const signature = await signMessage(message, MOCK_WEB3_PRIVATE_KEY);

      expect(signature).toBeDefined();
    });

    it('should stringify message object if it is not already a string', async () => {
      const message = { key: 'value' };
      const signature = await signMessage(message, MOCK_WEB3_PRIVATE_KEY);

      expect(signature).toBeDefined();
    });

    it('should not stringify message if it is already a string', async () => {
      const message = 'valid message';
      const signature = await signMessage(message, MOCK_WEB3_PRIVATE_KEY);

      expect(signature).toBeDefined();
    });
  });
});
