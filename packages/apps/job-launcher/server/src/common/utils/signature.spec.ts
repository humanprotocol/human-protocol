import { verifySignature, recoverSigner, signMessage } from './signature';
import { MOCK_ADDRESS, MOCK_PRIVATE_KEY } from '../../../test/constants';
import { ErrorSignature } from '../constants/errors';
import { ControlledError } from '../errors/controlled';
import { HttpStatus } from '@nestjs/common';

jest.doMock('ethers', () => {
  return {
    utils: {
      get verifyMessage() {
        return jest.fn((message, signature) => {
          if (message === 'valid-message' && signature === 'valid-signature') {
            return 'recovered-address';
          } else {
            throw new ControlledError(
              'Invalid signature',
              HttpStatus.BAD_REQUEST,
            );
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
      const signature = await signMessage(message, MOCK_PRIVATE_KEY);

      const result = verifySignature(message, signature, [MOCK_ADDRESS]);

      expect(result).toBe(true);
    });

    it('should throw conflict exception for signature not verified', async () => {
      const message = 'Hello, this is a signed message!';

      const invalidSignature = await signMessage(message, MOCK_PRIVATE_KEY);
      const invalidAddress = '0x1234567890123456789012345678901234567892';

      expect(() => {
        verifySignature(message, invalidSignature, [invalidAddress]);
      }).toThrow(
        new ControlledError(
          ErrorSignature.SignatureNotVerified,
          HttpStatus.CONFLICT,
        ),
      );
    });

    it('should throw conflict exception for invalid signature', () => {
      const message = 'Hello, this is a signed message!';
      const invalidSignature = '0xInvalidSignature';

      expect(() => {
        verifySignature(message, invalidSignature, [MOCK_ADDRESS]);
      }).toThrow(
        new ControlledError(
          ErrorSignature.InvalidSignature,
          HttpStatus.CONFLICT,
        ),
      );
    });
  });

  describe('recoverSigner', () => {
    it('should recover the correct signer', async () => {
      const message = 'value';
      const signature = await signMessage(message, MOCK_PRIVATE_KEY);

      const result = recoverSigner(message, signature);

      expect(result).toBe(MOCK_ADDRESS);
    });

    it('should throw conflict exception for invalid signature', () => {
      const message = 'Hello, this is a signed message!';
      const invalidSignature = '0xInvalidSignature';

      expect(() => {
        recoverSigner(message, invalidSignature);
      }).toThrow(
        new ControlledError(
          ErrorSignature.InvalidSignature,
          HttpStatus.CONFLICT,
        ),
      );
    });

    it('should stringify message object if it is not already a string', async () => {
      const message = { key: 'value' };
      const signature = await signMessage(message, MOCK_PRIVATE_KEY);

      const recoveredAddress = recoverSigner(message, signature);

      expect(recoveredAddress).toBe(MOCK_ADDRESS);
    });

    it('should not stringify message if it is already a string', async () => {
      const message = 'valid message';
      const signature = await signMessage(message, MOCK_PRIVATE_KEY);

      const recoveredAddress = recoverSigner(message, signature);

      expect(recoveredAddress).toBe(MOCK_ADDRESS);
    });
  });

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
