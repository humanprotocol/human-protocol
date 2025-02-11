/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, beforeAll } from 'vitest';
import { Encryption, EncryptionUtils } from '../src/encryption';
import {
  BINARY_MESSAGE_CONTENT,
  ENCRYPTEDMESSAGE,
  KEYPAIR1,
  KEYPAIR2,
  KEYPAIR3,
  MESSAGE,
  SIGNEDENCRYPTEDBINARYMESSAGE,
  SIGNEDENCRYPTEDLOCKEDMESSAGE,
  SIGNEDENCRYPTEDMESSAGE,
  SIGNEDMESSAGE,
} from './utils/constants';

describe('EncryptionUtils', async () => {
  describe('generateKeyPair', () => {
    test('should create a new key pair', async () => {
      const keyPair = await EncryptionUtils.generateKeyPair(
        'Human',
        'human@hmt.ai'
      );

      const expectedPrivateKeyHeader =
        '-----BEGIN PGP PRIVATE KEY BLOCK-----\n';
      const expectedPrivateKeyFooter = '-----END PGP PRIVATE KEY BLOCK-----\n';
      const expectedPublicKeyHeader = '-----BEGIN PGP PUBLIC KEY BLOCK-----\n';
      const expectedPublicKeyFooter = '-----END PGP PUBLIC KEY BLOCK-----\n';
      const expectedRevocationCertificateHeader =
        '-----BEGIN PGP PUBLIC KEY BLOCK-----\n';
      const expectedRevocationCertificateComment =
        'Comment: This is a revocation certificate\n';
      const expectedRevocationCertificateFooter =
        '-----END PGP PUBLIC KEY BLOCK-----\n';

      expect(keyPair.passphrase).toBeTypeOf('string');
      expect(keyPair.privateKey).toBeTypeOf('string');
      expect(
        keyPair.privateKey.includes(expectedPrivateKeyHeader)
      ).toBeTruthy();
      expect(
        keyPair.privateKey.includes(expectedPrivateKeyFooter)
      ).toBeTruthy();
      expect(keyPair.publicKey).toBeTypeOf('string');
      expect(keyPair.publicKey.includes(expectedPublicKeyHeader)).toBeTruthy();
      expect(keyPair.publicKey.includes(expectedPublicKeyFooter)).toBeTruthy();
      expect(keyPair.revocationCertificate).toBeTypeOf('string');
      expect(
        keyPair.revocationCertificate?.includes(
          expectedRevocationCertificateHeader
        )
      ).toBeTruthy();
      expect(
        keyPair.revocationCertificate?.includes(
          expectedRevocationCertificateComment
        )
      ).toBeTruthy();
      expect(
        keyPair.revocationCertificate?.includes(
          expectedRevocationCertificateFooter
        )
      ).toBeTruthy();
    });
  });

  describe('verify', () => {
    test('should verify a signed message', async () => {
      expect(
        await EncryptionUtils.verify(SIGNEDMESSAGE, KEYPAIR1.publicKey)
      ).toBeTruthy();
    });

    test('should fail when verifying with a different public key', async () => {
      expect(
        await EncryptionUtils.verify(SIGNEDMESSAGE, KEYPAIR2.publicKey)
      ).toBeFalsy();
    });

    test('should return false when an invalid public key is provided', async () => {
      const signedMessage = 'Signed Message';
      const invalidPublicKey = 'Invalid Public Key';

      await expect(
        EncryptionUtils.verify(signedMessage, invalidPublicKey)
      ).rejects.toThrowError('Misformed armored text');
    });

    test('should return false when an invalid signed message is provided', async () => {
      const invalidSignedMessage = 'Invalid Signed Message';

      await expect(
        EncryptionUtils.verify(invalidSignedMessage, KEYPAIR1.publicKey)
      ).rejects.toThrowError('Misformed armored text');
    });
  });

  describe('getSignedData', () => {
    test('should get the text from a signed message', async () => {
      const message = await EncryptionUtils.getSignedData(SIGNEDMESSAGE);
      expect(message).toBe(MESSAGE);
    });

    test('should throw an error when an invalid signed message is provided', async () => {
      const invalidSignedMessage = 'Invalid Signed Message';

      await expect(
        EncryptionUtils.getSignedData(invalidSignedMessage)
      ).rejects.toThrowError('Misformed armored text');
    });
  });

  describe('encrypt', () => {
    test('should encrypt a message', async () => {
      const encryptedMessage = await EncryptionUtils.encrypt(MESSAGE, [
        KEYPAIR1.publicKey,
      ]);

      const expectedMessageHeader = '-----BEGIN PGP MESSAGE-----\n';
      const expectedMessageFooter = '-----END PGP MESSAGE-----\n';

      expect(encryptedMessage.includes(expectedMessageHeader)).toBeTruthy();
      expect(encryptedMessage.includes(expectedMessageFooter)).toBeTruthy();
    });

    test('should throw an error when an invalid public key is provided', async () => {
      const invalidPublicKey = 'Invalid Public Key';

      await expect(
        EncryptionUtils.encrypt(MESSAGE, [invalidPublicKey])
      ).rejects.toThrowError('Misformed armored text');
    });

    test('should throw an error when no public keys are provided', async () => {
      await expect(EncryptionUtils.encrypt(MESSAGE, [])).rejects.toThrowError(
        'Error encrypting message: No keys, passwords, or session key provided.'
      );
    });
  });

  describe('isEncrypted', () => {
    test('should return true for a valid encrypted message', async () => {
      const encryptedMessage = `-----BEGIN PGP MESSAGE-----
wV4DqdeRpqH+jaISAQdAsvBFxikvjxRqC7ZlDe98cLd7/aeCEI/AcL8PpVKK
mC0wKlwxNg/ADi55z9jcYFuMC4kKE+C/teM+JqiI8DO9AwassQUvKFtULnpx
h2jaOjC/0sAQASjUsIFK8zbuDgk/P8T9Npn6px+GlJPg9K90iwtPWiIp0eyW
4zXamJZT51k2DyaUX/Rsc6P4PYhQRKjt0yxtH0jHPmKkLC/9eBeFf4GP0zlZ
18xMZ8uCpQCma708Gz0sJYxEz3u/eZdHD7Mc7tWQKyJG8MsTwM1P+fdK1X75
L9UryJG2AY+6kKZhG4dqjNxiO4fWluiB2u7iMF+iLEyE3SQCEYorWMC+NDWi
QIJZ7oQ2w7BaPo1a991gvTOSNm5v2x44KfqPI1uj859BjsQTCA==
=tsmI
-----END PGP MESSAGE-----`;
      const isEncrypted = EncryptionUtils.isEncrypted(encryptedMessage);
      expect(isEncrypted).toBe(true);
    });

    test('should return false for a message without start marker', async () => {
      const invalidMessage = `wV4DqdeRpqH+jaISAQdAsvBFxikvjxRqC7ZlDe98cLd7/aeCEI/AcL8PpVKK
mC0wKlwxNg/ADi55z9jcYFuMC4kKE+C/teM+JqiI8DO9AwassQUvKFtULnpx
h2jaOjC/0sAQASjUsIFK8zbuDgk/P8T9Npn6px+GlJPg9K90iwtPWiIp0eyW
4zXamJZT51k2DyaUX/Rsc6P4PYhQRKjt0yxtH0jHPmKkLC/9eBeFf4GP0zlZ
18xMZ8uCpQCma708Gz0sJYxEz3u/eZdHD7Mc7tWQKyJG8MsTwM1P+fdK1X75
L9UryJG2AY+6kKZhG4dqjNxiO4fWluiB2u7iMF+iLEyE3SQCEYorWMC+NDWi
QIJZ7oQ2w7BaPo1a991gvTOSNm5v2x44KfqPI1uj859BjsQTCA==
=tsmI
-----END PGP MESSAGE-----`;
      const isEncrypted = EncryptionUtils.isEncrypted(invalidMessage);
      expect(isEncrypted).toBe(false);
    });

    test('should return false for a message without end marker', async () => {
      const invalidMessage = `-----BEGIN PGP MESSAGE-----
wV4DqdeRpqH+jaISAQdAsvBFxikvjxRqC7ZlDe98cLd7/aeCEI/AcL8PpVKK
mC0wKlwxNg/ADi55z9jcYFuMC4kKE+C/teM+JqiI8DO9AwassQUvKFtULnpx
h2jaOjC/0sAQASjUsIFK8zbuDgk/P8T9Npn6px+GlJPg9K90iwtPWiIp0eyW
4zXamJZT51k2DyaUX/Rsc6P4PYhQRKjt0yxtH0jHPmKkLC/9eBeFf4GP0zlZ
18xMZ8uCpQCma708Gz0sJYxEz3u/eZdHD7Mc7tWQKyJG8MsTwM1P+fdK1X75
L9UryJG2AY+6kKZhG4dqjNxiO4fWluiB2u7iMF+iLEyE3SQCEYorWMC+NDWi
QIJZ7oQ2w7BaPo1a991gvTOSNm5v2x44KfqPI1uj859BjsQTCA==
=tsmI`;
      const isEncrypted = await EncryptionUtils.isEncrypted(invalidMessage);
      expect(isEncrypted).toBe(false);
    });

    test('should return false for an invalid message', async () => {
      const invalidEncryptedMessage = 'Invalid encrypted message';
      const isEncrypted = await EncryptionUtils.isEncrypted(
        invalidEncryptedMessage
      );
      expect(isEncrypted).toBe(false);
    });
  });
});

describe('Encryption', async () => {
  describe('build', () => {
    test('should build correctly', async () => {
      const encryption = await Encryption.build(
        KEYPAIR1.privateKey,
        KEYPAIR1.passphrase
      );
      expect(encryption).toBeInstanceOf(Encryption);
    });

    test('should build correctly with passphrase', async () => {
      const encryption = await Encryption.build(
        KEYPAIR3.privateKey,
        KEYPAIR3.passphrase
      );
      expect(encryption).toBeInstanceOf(Encryption);
    });

    test('should throw an error when an invalid private key is provided', async () => {
      const invalidPrivateKey = 'Invalid Private Key';
      const passphrase = 'passphrase';
      await expect(
        Encryption.build(invalidPrivateKey, passphrase)
      ).rejects.toThrowError('Misformed armored text');
    });
  });

  describe('signAndEncrypt', () => {
    test('should sign and encrypt a message', async () => {
      const encryption = await Encryption.build(KEYPAIR1.privateKey);
      const encryptedMessage = await encryption.signAndEncrypt(MESSAGE, [
        KEYPAIR2.publicKey,
        KEYPAIR3.publicKey,
      ]);

      const expectedMessageHeader = '-----BEGIN PGP MESSAGE-----\n';
      const expectedMessageFooter = '-----END PGP MESSAGE-----\n';

      expect(encryptedMessage.includes(expectedMessageHeader)).toBeTruthy();
      expect(encryptedMessage.includes(expectedMessageFooter)).toBeTruthy();
    });

    test('should sign and encrypt a message using locked private key', async () => {
      const encryption = await Encryption.build(
        KEYPAIR3.privateKey,
        KEYPAIR3.passphrase
      );
      const encryptedMessage = await encryption.signAndEncrypt(MESSAGE, [
        KEYPAIR2.publicKey,
        KEYPAIR1.publicKey,
      ]);

      const expectedMessageHeader = '-----BEGIN PGP MESSAGE-----\n';
      const expectedMessageFooter = '-----END PGP MESSAGE-----\n';

      expect(encryptedMessage.includes(expectedMessageHeader)).toBeTruthy();
      expect(encryptedMessage.includes(expectedMessageFooter)).toBeTruthy();
    });

    test('should sign and ecnrypt a binary message', async () => {
      const encryption = await Encryption.build(KEYPAIR1.privateKey);
      const encryptedMessage = await encryption.signAndEncrypt(
        Buffer.from(JSON.stringify(BINARY_MESSAGE_CONTENT)),
        [KEYPAIR2.publicKey, KEYPAIR3.publicKey]
      );

      const expectedMessageHeader = '-----BEGIN PGP MESSAGE-----\n';
      const expectedMessageFooter = '-----END PGP MESSAGE-----\n';

      expect(encryptedMessage.includes(expectedMessageHeader)).toBeTruthy();
      expect(encryptedMessage.includes(expectedMessageFooter)).toBeTruthy();
    });

    test('should throw an error when an invalid public key is provided', async () => {
      const encryption = await Encryption.build(
        KEYPAIR1.privateKey,
        KEYPAIR1.passphrase
      );
      const invalidPublicKey = 'Invalid Public Key';

      await expect(
        encryption.signAndEncrypt(MESSAGE, [invalidPublicKey])
      ).rejects.toThrowError('Misformed armored text');
    });

    test('should throw an error when no public keys are provided', async () => {
      const encryption = await Encryption.build(
        KEYPAIR1.privateKey,
        KEYPAIR1.passphrase
      );

      await expect(encryption.signAndEncrypt(MESSAGE, [])).rejects.toThrowError(
        'Error encrypting message: No keys, passwords, or session key provided.'
      );
    });
  });

  describe('decrypt', () => {
    let encryption: Encryption;
    beforeAll(async () => {
      encryption = await Encryption.build(KEYPAIR1.privateKey);
    });

    test('should decrypt and verify a message', async () => {
      const encryption2 = await Encryption.build(KEYPAIR2.privateKey);
      const decryptedMessage = await encryption2.decrypt(
        SIGNEDENCRYPTEDMESSAGE,
        KEYPAIR1.publicKey
      );
      expect(Buffer.from(decryptedMessage).toString()).toBe(MESSAGE);

      const encryption3 = await Encryption.build(
        KEYPAIR3.privateKey,
        KEYPAIR3.passphrase
      );
      const decryptedMessage2 = await encryption3.decrypt(
        SIGNEDENCRYPTEDMESSAGE,
        KEYPAIR1.publicKey
      );
      expect(Buffer.from(decryptedMessage2).toString()).toBe(MESSAGE);
    });

    test('should decrypt and verify binary message', async () => {
      const encryption2 = await Encryption.build(KEYPAIR2.privateKey);
      const decryptedMessage = await encryption2.decrypt(
        SIGNEDENCRYPTEDBINARYMESSAGE,
        KEYPAIR1.publicKey
      );
      expect(JSON.parse(Buffer.from(decryptedMessage).toString())).toEqual(
        BINARY_MESSAGE_CONTENT
      );
    });

    test('should decrypt and verify a message encrypted with a locked private key', async () => {
      const encryption2 = await Encryption.build(KEYPAIR2.privateKey);
      const decryptedMessage = await encryption2.decrypt(
        SIGNEDENCRYPTEDLOCKEDMESSAGE,
        KEYPAIR3.publicKey
      );

      expect(Buffer.from(decryptedMessage).toString()).toBe(MESSAGE);
    });

    test('should throw an error when no encrypted message is provided', async () => {
      const encryptedMessage = '';

      await expect(
        encryption.decrypt(encryptedMessage, KEYPAIR1.publicKey)
      ).rejects.toThrowError(
        'readMessage: must pass options object containing `armoredMessage` or `binaryMessage`'
      );
    });

    test('should throw an error when an invalid public key is provided for signature verification', async () => {
      await expect(
        encryption.decrypt(SIGNEDENCRYPTEDMESSAGE, 'Invalid Public Key')
      ).rejects.toThrowError('Misformed armored text');
    });

    test('should decrypt an unsigned message', async () => {
      const encryption2 = await Encryption.build(
        KEYPAIR2.privateKey,
        KEYPAIR2.passphrase
      );
      const decryptedMessage = await encryption2.decrypt(ENCRYPTEDMESSAGE);

      expect(Buffer.from(decryptedMessage).toString()).toBe(MESSAGE);
    });

    test('should fail when decrypting and verifying an unsigned message', async () => {
      const encryption2 = await Encryption.build(
        KEYPAIR2.privateKey,
        KEYPAIR2.passphrase
      );

      await expect(
        encryption2.decrypt(ENCRYPTEDMESSAGE, KEYPAIR1.publicKey)
      ).rejects.toThrowError('Signature could not be verified');
    });
  });

  describe('sign', () => {
    test('should sign a message', async () => {
      const encryption = await Encryption.build(
        KEYPAIR1.privateKey,
        KEYPAIR1.passphrase
      );
      const signedMessage = await encryption.sign(MESSAGE);

      const expectedMessageHeader = '-----BEGIN PGP SIGNED MESSAGE-----\n';
      const expectedSignatureHeader = '-----BEGIN PGP SIGNATURE-----\n';
      const expectedSignatureFooter = '-----END PGP SIGNATURE-----\n';

      expect(signedMessage.includes(expectedMessageHeader)).toBeTruthy();
      expect(signedMessage.includes(MESSAGE)).toBeTruthy();
      expect(signedMessage.includes(expectedSignatureHeader)).toBeTruthy();
      expect(signedMessage.includes(expectedSignatureFooter)).toBeTruthy();
    });
  });
});
