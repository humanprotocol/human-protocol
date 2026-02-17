import * as openpgp from 'openpgp';
import { IKeyPair } from '../interfaces';
import { makeMessageDataBinary, MessageDataType } from './types';
export class EncryptionUtils {
  /**
   * This function verifies the signature of a signed message using the public key.
   *
   * @param message - Message to verify.
   * @param publicKey - Public key to verify that the message was signed by a specific source.
   * @returns True if verified. False if not verified.
   *
   * @example
   * ```ts
   * import { EncryptionUtils } from '@human-protocol/sdk';
   *
   * const publicKey = '-----BEGIN PGP PUBLIC KEY BLOCK-----...';
   * const result = await EncryptionUtils.verify('message', publicKey);
   * console.log('Verification result:', result);
   * ```
   */
  public static async verify(
    message: string,
    publicKey: string
  ): Promise<boolean> {
    const pgpPublicKey = await openpgp.readKey({ armoredKey: publicKey });
    const signedMessage = await openpgp.readCleartextMessage({
      cleartextMessage: message,
    });

    const verificationResult = await signedMessage.verify([pgpPublicKey]);
    const { verified } = verificationResult[0];

    try {
      return await verified;
    } catch {
      return false;
    }
  }

  /**
   * This function gets signed data from a signed message.
   *
   * @param message - Message.
   * @returns Signed data.
   * @throws Error If data could not be extracted from the message
   *
   * @example
   * ```ts
   * import { EncryptionUtils } from '@human-protocol/sdk';
   *
   * const signedData = await EncryptionUtils.getSignedData('message');
   * console.log('Signed data:', signedData);
   * ```
   */
  public static async getSignedData(message: string): Promise<string> {
    const signedMessage = await openpgp.readCleartextMessage({
      cleartextMessage: message,
    });

    try {
      return signedMessage.getText();
    } catch (e) {
      throw new Error('Could not get data: ' + e.message);
    }
  }

  /**
   * This function generates a key pair for encryption and decryption.
   *
   * @param name - Name for the key pair.
   * @param email - Email for the key pair.
   * @param passphrase - Passphrase to encrypt the private key (optional, defaults to empty string).
   * @returns Key pair generated.
   *
   * @example
   * ```ts
   * import { EncryptionUtils } from '@human-protocol/sdk';
   *
   * const name = 'YOUR_NAME';
   * const email = 'YOUR_EMAIL';
   * const passphrase = 'YOUR_PASSPHRASE';
   * const keyPair = await EncryptionUtils.generateKeyPair(name, email, passphrase);
   * console.log('Public key:', keyPair.publicKey);
   * ```
   */
  public static async generateKeyPair(
    name: string,
    email: string,
    passphrase = ''
  ): Promise<IKeyPair> {
    const { privateKey, publicKey, revocationCertificate } =
      await openpgp.generateKey({
        type: 'ecc',
        curve: 'ed25519Legacy',
        userIDs: [{ name: name, email: email }],
        passphrase: passphrase,
        format: 'armored',
      });

    return {
      passphrase: passphrase,
      privateKey,
      publicKey,
      revocationCertificate,
    };
  }

  /**
   * This function encrypts a message using the specified public keys.
   *
   * @param message - Message to encrypt.
   * @param publicKeys - Array of public keys to use for encryption.
   * @returns Message encrypted.
   *
   * @example
   * ```ts
   * import { EncryptionUtils } from '@human-protocol/sdk';
   *
   * const publicKey1 = '-----BEGIN PGP PUBLIC KEY BLOCK-----...';
   * const publicKey2 = '-----BEGIN PGP PUBLIC KEY BLOCK-----...';
   * const publicKeys = [publicKey1, publicKey2];
   * const encryptedMessage = await EncryptionUtils.encrypt('message', publicKeys);
   * console.log('Encrypted message:', encryptedMessage);
   * ```
   */
  public static async encrypt(
    message: MessageDataType,
    publicKeys: string[]
  ): Promise<string> {
    const pgpPublicKeys = await Promise.all(
      publicKeys.map((armoredKey) => openpgp.readKey({ armoredKey }))
    );

    const pgpMessage = await openpgp.createMessage({
      binary: makeMessageDataBinary(message),
    });
    const encrypted = await openpgp.encrypt({
      message: pgpMessage,
      encryptionKeys: pgpPublicKeys,
      format: 'armored',
    });

    return encrypted as string;
  }

  /**
   * Verifies if a message appears to be encrypted with OpenPGP.
   *
   * @param message - Message to verify.
   * @returns `true` if the message appears to be encrypted, `false` if not.
   *
   * @example
   * ```ts
   * import { EncryptionUtils } from '@human-protocol/sdk';
   *
   * const message = '-----BEGIN PGP MESSAGE-----...';
   * const isEncrypted = EncryptionUtils.isEncrypted(message);
   *
   * if (isEncrypted) {
   *   console.log('The message is encrypted with OpenPGP.');
   * } else {
   *   console.log('The message is not encrypted with OpenPGP.');
   * }
   * ```
   */
  public static isEncrypted(message: string): boolean {
    const startMarker = '-----BEGIN PGP MESSAGE-----';
    const endMarker = '-----END PGP MESSAGE-----';

    const hasStartMarker = message.includes(startMarker);
    const hasEndMarker = message.includes(endMarker);

    return hasStartMarker && hasEndMarker;
  }
}
