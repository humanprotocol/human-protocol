/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, beforeAll } from 'vitest';
import { Encryption, EncryptionUtils } from '../src/encryption';

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

  let signedMessage: string;
  let signerPublicKey: string;
  let userPublicKey: string;

  beforeAll(async () => {
    signedMessage =
      '-----BEGIN PGP SIGNED MESSAGE-----\n' +
      'Hash: SHA512\n' +
      '\n' +
      'Human Protocol\n' +
      '-----BEGIN PGP SIGNATURE-----\n' +
      '\n' +
      'wnUEARYKACcFAmSVeIAJEFtLusO+9mQgFiEEn4tNyZomd4BYaFQXW0u6w772\n' +
      'ZCAAAJ/DAPwIsyrSMyOAjGefYg/MR8caWnKzQdjqhjUx0+X+M1A2cQEA4Ziz\n' +
      'OhJTPuZ66Ut6Pkp17qrh7tereT9fds4naLemLAE=\n' +
      '=n5sb\n' +
      '-----END PGP SIGNATURE-----\n';

    signerPublicKey =
      '-----BEGIN PGP PUBLIC KEY BLOCK-----\n' +
      '\n' +
      'xjMEZJV4gBYJKwYBBAHaRw8BAQdAzRO0m3WPL+H9ysiVasovPvbgGMYmfT3r\n' +
      '2k53Duvn9VrNFEh1bWFuIDxodW1hbkBobXQuYWk+wowEEBYKAD4FAmSVeIAE\n' +
      'CwkHCAkQW0u6w772ZCADFQgKBBYAAgECGQECGwMCHgEWIQSfi03JmiZ3gFho\n' +
      'VBdbS7rDvvZkIAAARqcA/RXPchnuKBCZxxMHVHU7HSZ/Td9Jz1nBeZWVpJnx\n' +
      '4BPlAQDgwRBpy26EDODUkYkLbBMC/1E+7XdcsV2gdNPPW9iuDc44BGSVeIAS\n' +
      'CisGAQQBl1UBBQEBB0Ck4kWIOrF0Wy0DEMM7vlcPh0+duwcVjUUJN8bRUD2m\n' +
      'CwMBCAfCeAQYFggAKgUCZJV4gAkQW0u6w772ZCACGwwWIQSfi03JmiZ3gFho\n' +
      'VBdbS7rDvvZkIAAA77YBAPJAy+pcV+Qo8Ds+kzlLb82Nzfn0c3/+fVoFHskr\n' +
      'yBJ1AQCPjmDeJc4rLFII6KE03Q0tj7AswVfNYDNod72KO8CfCw==\n' +
      '=Cgsp\n' +
      '-----END PGP PUBLIC KEY BLOCK-----\n';

    userPublicKey =
      '-----BEGIN PGP PUBLIC KEY BLOCK-----\n' +
      '\n' +
      'xjMEZJV4gBYJKwYBBAHaRw8BAQdAG/Ar95oib9CTqdZxHYutivbnJBDeuUin\n' +
      'xbuFuS3mbrzNFEh1bWFuIDxodW1hbkBobXQuYWk+wowEEBYKAD4FAmSVeIAE\n' +
      'CwkHCAkQSHjmQMIT8FoDFQgKBBYAAgECGQECGwMCHgEWIQTY1Bojzq38LJct\n' +
      'LyRIeOZAwhPwWgAADjABAO42MWQvAo6EFZMTc4hhp2W8vOBc0UEobFAYqMqu\n' +
      '0Y94AQCD66dKLkJRsK7TCYTHvzLCF6XgT6BTgidrH2FtmqQBBc44BGSVeIAS\n' +
      'CisGAQQBl1UBBQEBB0Cop9TrzXNlGUTktvcr3nT67dCXtPbnKopHHXMFLfIx\n' +
      'FAMBCAfCeAQYFggAKgUCZJV4gAkQSHjmQMIT8FoCGwwWIQTY1Bojzq38LJct\n' +
      'LyRIeOZAwhPwWgAATqsBAJ34mlCeR9a7T0Cgr+H47q4Tc/f3Tak+MPmwU6Uy\n' +
      'WlSKAP9QI/pMRhlaHQrpcTOZwIpqafg+K402Yx4ckdva9aZZCQ==\n' +
      '=nZAt\n' +
      '-----END PGP PUBLIC KEY BLOCK-----\n';
  });

  describe('verify', () => {
    test('should verify a signed message', async () => {
      expect(
        await EncryptionUtils.verify(signedMessage, signerPublicKey)
      ).toBeTruthy();
    });

    test('should fail when verifying with a different public key', async () => {
      expect(
        await EncryptionUtils.verify(signedMessage, userPublicKey)
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
        EncryptionUtils.verify(invalidSignedMessage, signerPublicKey)
      ).rejects.toThrowError('Misformed armored text');
    });
  });

  describe('getSignedData', () => {
    test('should get the text from a signed message', async () => {
      const message = await EncryptionUtils.getSignedData(signedMessage);
      expect(message).toBe('Human Protocol');
    });

    test('should throw an error when an invalid signed message is provided', async () => {
      const invalidSignedMessage = 'Invalid Signed Message';

      await expect(
        EncryptionUtils.getSignedData(invalidSignedMessage)
      ).rejects.toThrowError('Misformed armored text');
    });
  });
});

describe('Encryption', async () => {
  let keyPair1: any;
  let keyPair2: any;
  let keyPair3: any;

  beforeAll(async () => {
    keyPair1 = await EncryptionUtils.generateKeyPair('Human', 'human@hmt.ai');
    keyPair2 = await EncryptionUtils.generateKeyPair('Human', 'human@hmt.ai');
    keyPair3 = await EncryptionUtils.generateKeyPair('Human', 'human@hmt.ai');
  });

  describe('build', () => {
    test('should build correctly', async () => {
      const encryption = await Encryption.build(
        keyPair1.privateKey,
        keyPair1.passphrase
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

  describe('encrypt', () => {
    test('should encrypt a message', async () => {
      const encryption = await Encryption.build(
        keyPair1.privateKey,
        keyPair1.passphrase
      );
      const encryptedMessage = await encryption.encrypt('Human Protocol', [
        keyPair2.publicKey,
        keyPair3.publicKey,
      ]);

      const expectedMessageHeader = '-----BEGIN PGP MESSAGE-----\n';
      const expectedMessageFooter = '-----END PGP MESSAGE-----\n';

      expect(encryptedMessage.includes(expectedMessageHeader)).toBeTruthy();
      expect(encryptedMessage.includes(expectedMessageFooter)).toBeTruthy();
    });

    test('should throw an error when an invalid public key is provided', async () => {
      const encryption = await Encryption.build(
        keyPair1.privateKey,
        keyPair1.passphrase
      );
      const invalidPublicKey = 'Invalid Public Key';

      await expect(
        encryption.encrypt('Human Protocol', [invalidPublicKey])
      ).rejects.toThrowError('Misformed armored text');
    });

    test('should throw an error when no public keys are provided', async () => {
      const encryption = await Encryption.build(
        keyPair1.privateKey,
        keyPair1.passphrase
      );

      await expect(
        encryption.encrypt('Human Protocol', [])
      ).rejects.toThrowError(
        'Error encrypting message: No keys, passwords, or session key provided.'
      );
    });
  });

  describe('decrypt', () => {
    let encryption: Encryption;
    let encryptedMessage: string;
    beforeAll(async () => {
      encryption = await Encryption.build(
        keyPair1.privateKey,
        keyPair1.passphrase
      );
      encryptedMessage = await encryption.encrypt('Human Protocol', [
        keyPair2.publicKey,
        keyPair3.publicKey,
      ]);
    });

    test('should decrypt a message', async () => {
      const encryption2 = await Encryption.build(
        keyPair2.privateKey,
        keyPair2.passphrase
      );
      const decryptedMessage = await encryption2.decrypt(
        encryptedMessage,
        keyPair1.publicKey
      );

      expect(decryptedMessage).toBe('Human Protocol');

      const encryption3 = await Encryption.build(
        keyPair3.privateKey,
        keyPair3.passphrase
      );
      const decryptedMessage2 = await encryption3.decrypt(
        encryptedMessage,
        keyPair1.publicKey
      );
      expect(decryptedMessage2).toBe('Human Protocol');
    });

    test('should throw an error when no encrypted message is provided', async () => {
      const encryptedMessage = '';

      await expect(
        encryption.decrypt(encryptedMessage, keyPair1.publicKey)
      ).rejects.toThrowError(
        'readMessage: must pass options object containing `armoredMessage` or `binaryMessage`'
      );
    });

    test('should throw an error when an invalid public key is provided for signature verification', async () => {
      await expect(
        encryption.decrypt(encryptedMessage, 'Invalid Public Key')
      ).rejects.toThrowError('Misformed armored text');
    });
  });

  describe('sign', () => {
    test('should encrypt a message', async () => {
      const encryption = await Encryption.build(
        keyPair1.privateKey,
        keyPair1.passphrase
      );
      const signedMessage = await encryption.sign('Human Protocol');

      const expectedMessageHeader = '-----BEGIN PGP SIGNED MESSAGE-----\n';
      const expectedMessage = 'Human Protocol';
      const expectedSignatureHeader = '-----BEGIN PGP SIGNATURE-----\n';
      const expectedSignatureFooter = '-----END PGP SIGNATURE-----\n';

      expect(signedMessage.includes(expectedMessageHeader)).toBeTruthy();
      expect(signedMessage.includes(expectedMessage)).toBeTruthy();
      expect(signedMessage.includes(expectedSignatureHeader)).toBeTruthy();
      expect(signedMessage.includes(expectedSignatureFooter)).toBeTruthy();
    });
  });
});
