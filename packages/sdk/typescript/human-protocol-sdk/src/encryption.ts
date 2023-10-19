import * as openpgp from 'openpgp';
import { IKeyPair } from './interfaces';

/**
 * ## Introduction
 *
 * Class for sign and decrypt messages.
 *
 * The algorithm includes the implementation of the [PGP encryption algorithm](https://github.com/openpgpjs/openpgpjs) multi-public key encryption on typescript.
 * Using the vanilla [ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) implementation Schnorr signatures for signature and [curve25519](https://en.wikipedia.org/wiki/Curve25519) for encryption. [Learn more](https://wiki.polkadot.network/docs/learn-cryptography).
 *
 * To get an instance of this class, is recommended to initialize it using the static `build` method.
 *
 * ```ts
 * static async build(privateKeyArmored: string, passphrase?: string): Promise<Encryption>
 * ```
 *
 * ## Installation
 *
 * ### npm
 * ```bash
 * npm install @human-protocol/sdk
 * ```
 *
 * ### yarn
 * ```bash
 * yarn install @human-protocol/sdk
 * ```
 *
 * ## Input parameters
 *
 * - `privateKeyArmored` - The encrypted private key in armored format.
 * - `passphrase` - The passphrase for the private key.
 *
 * ## Code example
 *
 * ```ts
 * import { Encryption } from '@human-protocol/sdk';
 *
 * const privateKey = 'Armored_priv_key';
 * const passphrase = 'example_passphrase';
 * const encription = await Encryption.build(privateKey, passphrase);
 * ```
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
   * This function signs and encrypts a message using the private key used to initialize the client and the specified public keys.
   *
   * @param {string} message Message to sign and encrypt.
   * @param {string[]} publicKeys Array of public keys to use for encryption.
   * @returns {Promise<string>} Message signed and encrypted.
   *
   * **Code example**
   *
   * ```ts
   * import { Encryption } from '@human-protocol/sdk';
   * import { EscrowClient } from '@human-protocol/sdk';
   *
   * const privateKey = 'Armored_priv_key';
   * const passphrase = 'example_passphrase';
   * const encription = await Encryption.build(privateKey, passphrase);
   * const publicKey1 = `-----BEGIN PGP PUBLIC KEY BLOCK-----
   * xjMEZKQEMxYJKwYBBAHaRw8BAQdA5oZTq4UPlS0IXn4kEaSqQdAa9+Cq522v
   * WYxJQn3vo1/NFEh1bWFuIDxodW1hbkBobXQuYWk+wowEEBYKAD4FAmSkBDME
   * CwkHCAkQJBFPuuhtQo4DFQgKBBYAAgECGQECGwMCHgEWIQTQ5fbVPB9CWIdf
   * XdYkEU+66G1CjgAAKYYA/jMyDCtJtqu6hj22kq9SW6fuV1FCT2ySJ9vBhumF
   * X8wWAP433zVFl4VECOkgGk8qFr8BgkYxaz16GOFAqYbfO6oMBc44BGSkBDMS
   * CisGAQQBl1UBBQEBB0AKR+A48zVVYZWQvgu7Opn2IGvzI9jePB/J8pzqRhg2
   * YAMBCAfCeAQYFggAKgUCZKQEMwkQJBFPuuhtQo4CGwwWIQTQ5fbVPB9CWIdf
   * XdYkEU+66G1CjgAA0xgBAK4AIahFFnmWR2Mp6A3q021cZXpGklc0Xw1Hfswc
   * UYLqAQDfdym4kiUvKO1+REKASt0Gwykndl7hra9txqlUL5DXBQ===Vwgv
   * -----END PGP PUBLIC KEY BLOCK-----`;
   *
   * const publicKey2 = `-----BEGIN PGP PUBLIC KEY BLOCK-----
   * xjMEZKQEMxYJKwYBBAHaRw8BAQdAG6h+E+6T/RV2tIHer3FP/jKThAyGcoVx
   * FzhnP0hncPzNFEh1bWFuIDxodW1hbkBobXQuYWk+wowEEBYKAD4FAmSkBDME
   * CwkHCAkQPIq5xLhlTYkDFQgKBBYAAgECGQECGwMCHgEWIQTcxtMgul/AeUvH
   * bio8irnEuGVNiQAA/HsBANpfFkxNYixpsBk8LlaaCaPy5f1/cWNPgODM9uzo
   * ciSTAQDtAYynu4dSJO9GbMuDuc0FaUHRWJK3mS6JkvedYL4oBM44BGSkBDMS
   * CisGAQQBl1UBBQEBB0DWbEG7DMhkeSc8ZPzrH8XNSCqS3t9y/oQidFR+xN3Z
   * bAMBCAfCeAQYFggAKgUCZKQEMwkQPIq5xLhlTYkCGwwWIQTcxtMgul/AeUvH
   * bio8irnEuGVNiQAAqt8BAM/4Lw0RVOb0L5Ki9CyxO/6AKvRg4ra3Q3WR+duP
   * s/88AQCDErzvn+SOX4s3gvZcM3Vr4wh4Q2syHV8Okgx8STYPDg===DsVk
   * -----END PGP PUBLIC KEY BLOCK-----`;
   *
   * const publicKeys = [publicKey1, publicKey2];
   * const resultMessage = await encription.signAndEncrypt('message', publicKeys);
   * ```
   */
  public async signAndEncrypt(
    message: string,
    publicKeys: string[]
  ): Promise<string> {
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
   * This function decrypt message message using the private key. In addition, the public key can be added for signature verification.
   *
   * @param {string} message Message to decrypt.
   * @param {string} publicKey Public key used to verify signature if needed. Optional.
   * @returns {Promise<string>} Message decrypted.
   *
   * **Code example**
   *
   * ```ts
   * import { Encryption } from '@human-protocol/sdk';
   *
   * const privateKey = 'Armored_priv_key';
   * const passphrase = 'example_passphrase';
   * const encription = await Encryption.build(privateKey, passphrase);
   *
   * const publicKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----
   * xjMEZKQEMxYJKwYBBAHaRw8BAQdA5oZTq4UPlS0IXn4kEaSqQdAa9+Cq522v
   * WYxJQn3vo1/NFEh1bWFuIDxodW1hbkBobXQuYWk+wowEEBYKAD4FAmSkBDME
   * CwkHCAkQJBFPuuhtQo4DFQgKBBYAAgECGQECGwMCHgEWIQTQ5fbVPB9CWIdf
   * XdYkEU+66G1CjgAAKYYA/jMyDCtJtqu6hj22kq9SW6fuV1FCT2ySJ9vBhumF
   * X8wWAP433zVFl4VECOkgGk8qFr8BgkYxaz16GOFAqYbfO6oMBc44BGSkBDMS
   * CisGAQQBl1UBBQEBB0AKR+A48zVVYZWQvgu7Opn2IGvzI9jePB/J8pzqRhg2
   * YAMBCAfCeAQYFggAKgUCZKQEMwkQJBFPuuhtQo4CGwwWIQTQ5fbVPB9CWIdf
   * XdYkEU+66G1CjgAA0xgBAK4AIahFFnmWR2Mp6A3q021cZXpGklc0Xw1Hfswc
   * UYLqAQDfdym4kiUvKO1+REKASt0Gwykndl7hra9txqlUL5DXBQ===Vwgv
   * -----END PGP PUBLIC KEY BLOCK-----`;
   *
   * const resultMessage = await encription.decrypt('message');
   * ```
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
   * This function signs a message using the private key used to initialize the client.
   *
   * @param {string} message Message to sign.
   * @returns {Promise<string>} Message signed.
   *
   * **Code example**
   *
   * ```ts
   * import { Encryption } from '@human-protocol/sdk';
   *
   * const privateKey = 'Armored_priv_key';
   * const passphrase = 'example_passphrase';
   * const encription = await Encryption.build(privateKey, passphrase);
   *
   * const resultMessage = await encription.sign('message');
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
 * ## Introduction
 *
 * Utility class for encryption-related operations.
 *
 * ## Installation
 *
 * ### npm
 * ```bash
 * npm install @human-protocol/sdk
 * ```
 *
 * ### yarn
 * ```bash
 * yarn install @human-protocol/sdk
 * ```
 *
 * ## Code example
 *
 * ```ts
 * import { EncryptionUtils } from '@human-protocol/sdk';
 *
 * const keyPair = await EncryptionUtils.generateKeyPair('Human', 'human@hmt.ai');
 * ```
 */
export class EncryptionUtils {
  /**
   * This function verifies the signature of a signed message using the public key.
   *
   * @param {string} message Message to verify.
   * @param {string} publicKey Public key to verify that the message was sign by a specific source.
   * @returns {Promise<boolean>} True if verified. False if not verified.
   *
   * **Code example**
   *
   * ```ts
   * import { EncryptionUtils } from '@human-protocol/sdk';
   *
   * const publicKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----
   * xjMEZKQEMxYJKwYBBAHaRw8BAQdA5oZTq4UPlS0IXn4kEaSqQdAa9+Cq522v
   * WYxJQn3vo1/NFEh1bWFuIDxodW1hbkBobXQuYWk+wowEEBYKAD4FAmSkBDME
   * CwkHCAkQJBFPuuhtQo4DFQgKBBYAAgECGQECGwMCHgEWIQTQ5fbVPB9CWIdf
   * XdYkEU+66G1CjgAAKYYA/jMyDCtJtqu6hj22kq9SW6fuV1FCT2ySJ9vBhumF
   * X8wWAP433zVFl4VECOkgGk8qFr8BgkYxaz16GOFAqYbfO6oMBc44BGSkBDMS
   * CisGAQQBl1UBBQEBB0AKR+A48zVVYZWQvgu7Opn2IGvzI9jePB/J8pzqRhg2
   * YAMBCAfCeAQYFggAKgUCZKQEMwkQJBFPuuhtQo4CGwwWIQTQ5fbVPB9CWIdf
   * XdYkEU+66G1CjgAA0xgBAK4AIahFFnmWR2Mp6A3q021cZXpGklc0Xw1Hfswc
   * UYLqAQDfdym4kiUvKO1+REKASt0Gwykndl7hra9txqlUL5DXBQ===Vwgv
   * -----END PGP PUBLIC KEY BLOCK-----`;
   *
   * const result = await EncriptionUtils.verify('message', publicKey);
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
   * @param {string} message Message.
   * @returns {Promise<string>} Signed data.
   *
   * **Code example**
   *
   * ```ts
   * import { EncryptionUtils } from '@human-protocol/sdk';
   *
   * const signedData = await EncriptionUtils.getSignedData('message');
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
   * @param {string} name Name for the key pair.
   * @param {string} email Email for the key pair.
   * @param {string} passphrase Passphrase to encrypt the private key. Optional.
   * @returns {Promise<IKeyPair>} Key pair generated.
   *
   * **Code example**
   *
   * ```ts
   * import { EncryptionUtils } from '@human-protocol/sdk';
   *
   * const publicKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----
   * xjMEZKQEMxYJKwYBBAHaRw8BAQdA5oZTq4UPlS0IXn4kEaSqQdAa9+Cq522v
   * WYxJQn3vo1/NFEh1bWFuIDxodW1hbkBobXQuYWk+wowEEBYKAD4FAmSkBDME
   * CwkHCAkQJBFPuuhtQo4DFQgKBBYAAgECGQECGwMCHgEWIQTQ5fbVPB9CWIdf
   * XdYkEU+66G1CjgAAKYYA/jMyDCtJtqu6hj22kq9SW6fuV1FCT2ySJ9vBhumF
   * X8wWAP433zVFl4VECOkgGk8qFr8BgkYxaz16GOFAqYbfO6oMBc44BGSkBDMS
   * CisGAQQBl1UBBQEBB0AKR+A48zVVYZWQvgu7Opn2IGvzI9jePB/J8pzqRhg2
   * YAMBCAfCeAQYFggAKgUCZKQEMwkQJBFPuuhtQo4CGwwWIQTQ5fbVPB9CWIdf
   * XdYkEU+66G1CjgAA0xgBAK4AIahFFnmWR2Mp6A3q021cZXpGklc0Xw1Hfswc
   * UYLqAQDfdym4kiUvKO1+REKASt0Gwykndl7hra9txqlUL5DXBQ===Vwgv
   * -----END PGP PUBLIC KEY BLOCK-----`;
   *
   * const name = 'YOUR_NAME';
   * const email = 'YOUR_EMAIL';
   * const passphrase = 'YOUR_PASSPHRASE';
   * const result = await EncriptionUtils.generateKeyPair(name, email, passphrase);
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
   * This function encrypts a message using the specified public keys.
   *
   * @param {string} message Message to encrypt.
   * @param {string} publicKey Array of public keys to use for encryption.
   * @returns {Promise<string>} Message encrypted.
   *
   * **Code example**
   *
   * ```ts
   * import { EncryptionUtils } from '@human-protocol/sdk';
   *
   * const publicKey1 = `-----BEGIN PGP PUBLIC KEY BLOCK-----
   * xjMEZKQEMxYJKwYBBAHaRw8BAQdA5oZTq4UPlS0IXn4kEaSqQdAa9+Cq522v
   * WYxJQn3vo1/NFEh1bWFuIDxodW1hbkBobXQuYWk+wowEEBYKAD4FAmSkBDME
   * CwkHCAkQJBFPuuhtQo4DFQgKBBYAAgECGQECGwMCHgEWIQTQ5fbVPB9CWIdf
   * XdYkEU+66G1CjgAAKYYA/jMyDCtJtqu6hj22kq9SW6fuV1FCT2ySJ9vBhumF
   * X8wWAP433zVFl4VECOkgGk8qFr8BgkYxaz16GOFAqYbfO6oMBc44BGSkBDMS
   * CisGAQQBl1UBBQEBB0AKR+A48zVVYZWQvgu7Opn2IGvzI9jePB/J8pzqRhg2
   * YAMBCAfCeAQYFggAKgUCZKQEMwkQJBFPuuhtQo4CGwwWIQTQ5fbVPB9CWIdf
   * XdYkEU+66G1CjgAA0xgBAK4AIahFFnmWR2Mp6A3q021cZXpGklc0Xw1Hfswc
   * UYLqAQDfdym4kiUvKO1+REKASt0Gwykndl7hra9txqlUL5DXBQ===Vwgv
   * -----END PGP PUBLIC KEY BLOCK-----`;
   *
   * const publicKey2 = `-----BEGIN PGP PUBLIC KEY BLOCK-----
   * xjMEZKQEMxYJKwYBBAHaRw8BAQdAG6h+E+6T/RV2tIHer3FP/jKThAyGcoVx
   * FzhnP0hncPzNFEh1bWFuIDxodW1hbkBobXQuYWk+wowEEBYKAD4FAmSkBDME
   * CwkHCAkQPIq5xLhlTYkDFQgKBBYAAgECGQECGwMCHgEWIQTcxtMgul/AeUvH
   * bio8irnEuGVNiQAA/HsBANpfFkxNYixpsBk8LlaaCaPy5f1/cWNPgODM9uzo
   * ciSTAQDtAYynu4dSJO9GbMuDuc0FaUHRWJK3mS6JkvedYL4oBM44BGSkBDMS
   * CisGAQQBl1UBBQEBB0DWbEG7DMhkeSc8ZPzrH8XNSCqS3t9y/oQidFR+xN3Z
   * bAMBCAfCeAQYFggAKgUCZKQEMwkQPIq5xLhlTYkCGwwWIQTcxtMgul/AeUvH
   * bio8irnEuGVNiQAAqt8BAM/4Lw0RVOb0L5Ki9CyxO/6AKvRg4ra3Q3WR+duP
   * s/88AQCDErzvn+SOX4s3gvZcM3Vr4wh4Q2syHV8Okgx8STYPDg===DsVk
   * -----END PGP PUBLIC KEY BLOCK-----`;
   *
   * const publicKeys = [publicKey1, publicKey2]
   * const result = await EncriptionUtils.encrypt('message', publicKeys);
   * ```
   */
  public static async encrypt(
    message: string,
    publicKeys: string[]
  ): Promise<string> {
    const plaintext = message;

    const pgpPublicKeys = await Promise.all(
      publicKeys.map((armoredKey) => openpgp.readKey({ armoredKey }))
    );

    const pgpMessage = await openpgp.createMessage({ text: plaintext });
    const encrypted = await openpgp.encrypt({
      message: pgpMessage,
      encryptionKeys: pgpPublicKeys,
    });

    return encrypted as string;
  }
}
