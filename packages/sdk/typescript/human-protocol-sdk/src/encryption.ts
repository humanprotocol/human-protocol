import * as openpgp from 'openpgp';
import { IKeyPair } from './interfaces';
/**
 * Class for encryption and decryption operations.
 */
export class Encryption {
  private privateKeyArmored: string;
  private passphrase: string;

  /**
   * Constructor for the Encryption class.
   *
   * @param {string} privateKey - The private key in armored format.
   * @param {string} passphrase - The passphrase for the private key.
   */
  constructor(privateKey: string, passphrase: string) {
    this.privateKeyArmored = privateKey;
    this.passphrase = passphrase;
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
    const privateKey = await EncryptionUtils.getDecryptedPrivateKey(
      this.privateKeyArmored,
      this.passphrase
    );

    const pgpPublicKeys = await Promise.all(
      publicKeys.map((armoredKey) => openpgp.readKey({ armoredKey }))
    );

    const pgpMessage = await openpgp.createMessage({ text: plaintext });
    const encrypted = await openpgp.encrypt({
      message: pgpMessage,
      encryptionKeys: pgpPublicKeys,
      signingKeys: privateKey,
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
    const privateKey = await EncryptionUtils.getDecryptedPrivateKey(
      this.privateKeyArmored,
      this.passphrase
    );
    const pgpMessage = await openpgp.readMessage({ armoredMessage: message });

    const decryptionOptions: openpgp.DecryptOptions = {
      message: pgpMessage,
      decryptionKeys: privateKey,
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
    const privateKey = await EncryptionUtils.getDecryptedPrivateKey(
      this.privateKeyArmored,
      this.passphrase
    );

    const unsignedMessage = await openpgp.createCleartextMessage({
      text: message,
    });
    const cleartextMessage = await openpgp.sign({
      message: unsignedMessage,
      signingKeys: privateKey,
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
   * @param {string} publicKeyArmored - The public key in armored format.
   * @param {string} message - The signed message.
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

  /**
   * Gets the decrypted private key from an encrypted private key and passphrase.
   *
   * @param {string} privateKey - The encrypted private key in armored format.
   * @param {string} passphrase - The passphrase for the private key.
   * @returns {Promise<string>} - The decrypted private key.
   */
  public static async getDecryptedPrivateKey(
    privateKeyArmored: string,
    passphrase: string
  ): Promise<openpgp.PrivateKey> {
    const options = {
      armoredKey: privateKeyArmored,
    };

    if (!passphrase) {
      return openpgp.readPrivateKey(options);
    }

    const privateKey = await openpgp.readPrivateKey(options);
    return openpgp.decryptKey({
      privateKey,
      passphrase,
    });
  }
}
