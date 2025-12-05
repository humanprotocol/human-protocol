import * as openpgp from 'openpgp';
import { IKeyPair } from './interfaces';

/**
 * Type representing the data type of a message.
 * It can be either a string or a Uint8Array.
 */
type MessageDataType = string | Uint8Array;

function makeMessageDataBinary(message: MessageDataType): Uint8Array {
  if (typeof message === 'string') {
    return Buffer.from(message);
  }

  return message;
}

/**
 * Class for signing and decrypting messages.
 *
 * The algorithm includes the implementation of the [PGP encryption algorithm](https://github.com/openpgpjs/openpgpjs) multi-public key encryption on typescript, and uses the vanilla [ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) implementation Schnorr signature for signatures and [curve25519](https://en.wikipedia.org/wiki/Curve25519) for encryption. [Learn more](https://wiki.polkadot.network/docs/learn-cryptography).
 *
 * To get an instance of this class, initialization is recommended using the static [`build`](/ts/classes/Encryption/#build) method.
 */
export class Encryption {
  private privateKey: openpgp.PrivateKey;

  /**
   * Constructor for the Encryption class.
   *
   * @param privateKey - The private key.
   */
  constructor(privateKey: openpgp.PrivateKey) {
    this.privateKey = privateKey;
  }

  /**
   * Builds an Encryption instance by decrypting the private key from an encrypted private key and passphrase.
   *
   * @param privateKeyArmored - The encrypted private key in armored format.
   * @param passphrase - The passphrase for the private key (optional).
   * @returns The Encryption instance.
   *
   * @example
   * ```ts
   * import { Encryption } from '@human-protocol/sdk';
   *
   * const privateKey = 'Armored_priv_key';
   * const passphrase = 'example_passphrase';
   * const encryption = await Encryption.build(privateKey, passphrase);
   * ```
   */
  public static async build(
    privateKeyArmored: string,
    passphrase?: string
  ): Promise<Encryption> {
    const options = {
      armoredKey: privateKeyArmored,
    };

    if (!passphrase) {
      return new Encryption(await openpgp.readPrivateKey(options));
    }

    const privateKey = await openpgp.readPrivateKey(options);
    return new Encryption(
      await openpgp.decryptKey({
        privateKey,
        passphrase,
      })
    );
  }

  /**
   * This function signs and encrypts a message using the private key used to initialize the client and the specified public keys.
   *
   * @param message - Message to sign and encrypt.
   * @param publicKeys - Array of public keys to use for encryption.
   * @returns Message signed and encrypted.
   *
   * @example
   * ```ts
   * const publicKey1 = '-----BEGIN PGP PUBLIC KEY BLOCK-----...';
   * const publicKey2 = '-----BEGIN PGP PUBLIC KEY BLOCK-----...';
   *
   * const publicKeys = [publicKey1, publicKey2];
   * const resultMessage = await encryption.signAndEncrypt('message', publicKeys);
   * console.log('Encrypted message:', resultMessage);
   * ```
   */
  public async signAndEncrypt(
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
      signingKeys: this.privateKey,
      format: 'armored',
    });

    return encrypted as string;
  }

  /**
   * This function decrypts messages using the private key. In addition, the public key can be added for signature verification.
   *
   * @param message - Message to decrypt.
   * @param publicKey - Public key used to verify signature if needed (optional).
   * @returns Message decrypted.
   * @throws Error If signature could not be verified when public key is provided
   *
   * @example
   * ```ts
   * const publicKey = '-----BEGIN PGP PUBLIC KEY BLOCK-----...';
   *
   * const resultMessage = await encryption.decrypt('message', publicKey);
   * console.log('Decrypted message:', resultMessage);
   * ```
   */
  public async decrypt(
    message: string,
    publicKey?: string
  ): Promise<Uint8Array> {
    const pgpMessage = await openpgp.readMessage({
      armoredMessage: message,
    });

    const decryptionOptions: openpgp.DecryptOptions = {
      message: pgpMessage,
      decryptionKeys: this.privateKey,
      format: 'binary',
    };

    const shouldVerifySignature = !!publicKey;
    if (shouldVerifySignature) {
      const pgpPublicKey = await openpgp.readKey({ armoredKey: publicKey });
      decryptionOptions.verificationKeys = pgpPublicKey;
    }

    const { data: decrypted, signatures } =
      await openpgp.decrypt(decryptionOptions);

    /**
     * There is an option to automatically verify signatures - `expectSigned`,
     * but atm it has a bug - https://github.com/openpgpjs/openpgpjs/issues/1803,
     * so we have to verify it manually till it's fixed.
     */
    try {
      if (shouldVerifySignature) {
        await signatures[0].verified;
      }
    } catch {
      throw new Error('Signature could not be verified');
    }

    return decrypted as Uint8Array;
  }

  /**
   * This function signs a message using the private key used to initialize the client.
   *
   * @param message - Message to sign.
   * @returns Message signed.
   *
   * @example
   * ```ts
   * const resultMessage = await encryption.sign('message');
   * console.log('Signed message:', resultMessage);
   * ```
   */
  public async sign(message: string): Promise<string> {
    const unsignedMessage = await openpgp.createCleartextMessage({
      text: message,
    });
    const cleartextMessage = await openpgp.sign({
      message: unsignedMessage,
      signingKeys: this.privateKey,
      format: 'armored',
    });

    return cleartextMessage;
  }
}

/**
 * Utility class for encryption-related operations.
 *
 * @example
 * ```ts
 * import { EncryptionUtils } from '@human-protocol/sdk';
 *
 * const publicKey = '-----BEGIN PGP PUBLIC KEY BLOCK-----...';
 * const isValid = await EncryptionUtils.verify('message', publicKey);
 * console.log('Signature valid:', isValid);
 * ```
 */
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
