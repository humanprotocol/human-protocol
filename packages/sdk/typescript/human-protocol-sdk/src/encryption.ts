import * as openpgp from 'openpgp';
import { IKeyPair } from './interfaces';
/**
 * Class for encryption and decryption operations.
 */
export class Encryption {
  private privateKey: openpgp.PrivateKey;

  /**
   * Constructor for the Encryption class.
   *
   * @param {PrivateKey} privateKey - The private key.
   */
  constructor(privateKey: openpgp.PrivateKey) {
    this.privateKey = privateKey;
  }

  /**
   * Builds an Encryption instance by decrypting the private key from an encrypted private key and passphrase.
   *
   * @param {string} privateKeyArmored - The encrypted private key in armored format.
   * @param {string} passphrase - Optional: The passphrase for the private key.
   * @returns {Promise<Encryption>} - The Encryption instance.
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
   * Encrypts a message using the specified public keys.
   *
   * @param {string} message - The message to encrypt.
   * @param {string[]} publicKeys - The public keys in armored format.
   * @returns {Promise<string>} - The encrypted message.
   */
  public async encrypt(message: string, publicKeys: string[]): Promise<string> {
    const plaintext = message;

    const pgpPublicKeys = await Promise.all(
      publicKeys.map((armoredKey) => openpgp.readKey({ armoredKey }))
    );

    const pgpMessage = await openpgp.createMessage({ text: plaintext });
    const encrypted = await openpgp.encrypt({
      message: pgpMessage,
      encryptionKeys: pgpPublicKeys,
      signingKeys: this.privateKey,
    });

    return encrypted as string;
  }

  /**
   * Decrypts an encrypted message using the private key.
   *
   * @param {string} message - The encrypted message.
   * @param {string} publicKey - Optional: The public key in armored format for signature verification.
   * @returns {Promise<string>} - The decrypted message.
   */
  public async decrypt(message: string, publicKey?: string): Promise<string> {
    const pgpMessage = await openpgp.readMessage({ armoredMessage: message });

    const decryptionOptions: openpgp.DecryptOptions = {
      message: pgpMessage,
      decryptionKeys: this.privateKey,
      expectSigned: !!publicKey,
    };

    if (publicKey) {
      const pgpPublicKey = await openpgp.readKey({ armoredKey: publicKey });
      decryptionOptions.verificationKeys = pgpPublicKey;
    }

    const { data: decrypted } = await openpgp.decrypt(decryptionOptions);

    return decrypted as string;
  }

  /**
   * Signs a message using the private key.
   *
   * @param {string} message - The message to sign.
   * @returns {Promise<string>} - The signed message.
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
 */
export class EncryptionUtils {
  /**
   * Verifies the signature of a signed message using the public key.
   *
   * @param {string} message - The signed message.
   * @param {string} publicKey - The public key in armored format.
   * @returns {Promise<boolean>} - A boolean indicating if the signature is valid.
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
   * Gets the signed data from a signed message.
   *
   * @param {string} message - The signed message.
   * @returns {Promise<string>} - The signed data.
   * @throws {Error} - An error object if an error occurred.
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
   * Generates a key pair for encryption and decryption.
   *
   * @param {string} name - The name for the key pair.
   * @param {string} email - The email for the key pair.
   * @param {string} passphrase - The passphrase used to encrypt the private key.
   * @returns {Promise<IKeyPair>} - The generated key pair.
   */
  public static async generateKeyPair(
    name: string,
    email: string,
    passphrase = ''
  ): Promise<IKeyPair> {
    const { privateKey, publicKey, revocationCertificate } =
      await openpgp.generateKey({
        type: 'ecc',
        curve: 'ed25519',
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
}
