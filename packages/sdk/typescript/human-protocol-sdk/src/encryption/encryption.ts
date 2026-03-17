import * as openpgp from 'openpgp';
import { makeMessageDataBinary, MessageDataType } from './types';

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
