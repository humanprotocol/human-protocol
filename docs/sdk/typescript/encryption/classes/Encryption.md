[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [encryption](../README.md) / Encryption

# Class: Encryption

Defined in: [encryption.ts:58](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L58)

## Introduction

Class for signing and decrypting messages.

The algorithm includes the implementation of the [PGP encryption algorithm](https://github.com/openpgpjs/openpgpjs) multi-public key encryption on typescript, and uses the vanilla [ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) implementation Schnorr signature for signatures and [curve25519](https://en.wikipedia.org/wiki/Curve25519) for encryption. [Learn more](https://wiki.polkadot.network/docs/learn-cryptography).

To get an instance of this class, initialization is recommended using the static `build` method.

```ts
static async build(privateKeyArmored: string, passphrase?: string): Promise<Encryption>
```

## Installation

### npm
```bash
npm install @human-protocol/sdk
```

### yarn
```bash
yarn install @human-protocol/sdk
```

## Input parameters

- `privateKeyArmored` - The encrypted private key in armored format.
- `passphrase` - The passphrase for the private key.

## Code example

```ts
import { Encryption } from '@human-protocol/sdk';

const privateKey = 'Armored_priv_key';
const passphrase = 'example_passphrase';
const encryption = await Encryption.build(privateKey, passphrase);
```

## Constructors

### Constructor

> **new Encryption**(`privateKey`): `Encryption`

Defined in: [encryption.ts:66](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L66)

Constructor for the Encryption class.

#### Parameters

##### privateKey

`PrivateKey`

The private key.

#### Returns

`Encryption`

## Methods

### decrypt()

> **decrypt**(`message`, `publicKey?`): `Promise`\<`Uint8Array`\<`ArrayBufferLike`\>\>

Defined in: [encryption.ts:194](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L194)

This function decrypts messages using the private key. In addition, the public key can be added for signature verification.

#### Parameters

##### message

`string`

Message to decrypt.

##### publicKey?

`string`

Public key used to verify signature if needed. This is optional.

#### Returns

`Promise`\<`Uint8Array`\<`ArrayBufferLike`\>\>

Message decrypted.

**Code example**

```ts
import { Encryption } from '@human-protocol/sdk';

const privateKey = 'Armored_priv_key';
const passphrase = 'example_passphrase';
const encryption = await Encryption.build(privateKey, passphrase);

const publicKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----
xjMEZKQEMxYJKwYBBAHaRw8BAQdA5oZTq4UPlS0IXn4kEaSqQdAa9+Cq522v
WYxJQn3vo1/NFEh1bWFuIDxodW1hbkBobXQuYWk+wowEEBYKAD4FAmSkBDME
CwkHCAkQJBFPuuhtQo4DFQgKBBYAAgECGQECGwMCHgEWIQTQ5fbVPB9CWIdf
XdYkEU+66G1CjgAAKYYA/jMyDCtJtqu6hj22kq9SW6fuV1FCT2ySJ9vBhumF
X8wWAP433zVFl4VECOkgGk8qFr8BgkYxaz16GOFAqYbfO6oMBc44BGSkBDMS
CisGAQQBl1UBBQEBB0AKR+A48zVVYZWQvgu7Opn2IGvzI9jePB/J8pzqRhg2
YAMBCAfCeAQYFggAKgUCZKQEMwkQJBFPuuhtQo4CGwwWIQTQ5fbVPB9CWIdf
XdYkEU+66G1CjgAA0xgBAK4AIahFFnmWR2Mp6A3q021cZXpGklc0Xw1Hfswc
UYLqAQDfdym4kiUvKO1+REKASt0Gwykndl7hra9txqlUL5DXBQ===Vwgv
-----END PGP PUBLIC KEY BLOCK-----`;

const resultMessage = await encryption.decrypt('message');
```

***

### sign()

> **sign**(`message`): `Promise`\<`string`\>

Defined in: [encryption.ts:251](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L251)

This function signs a message using the private key used to initialize the client.

#### Parameters

##### message

`string`

Message to sign.

#### Returns

`Promise`\<`string`\>

Message signed.

**Code example**

```ts
import { Encryption } from '@human-protocol/sdk';

const privateKey = 'Armored_priv_key';
const passphrase = 'example_passphrase';
const encryption = await Encryption.build(privateKey, passphrase);

const resultMessage = await encryption.sign('message');
```

***

### signAndEncrypt()

> **signAndEncrypt**(`message`, `publicKeys`): `Promise`\<`string`\>

Defined in: [encryption.ts:142](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L142)

This function signs and encrypts a message using the private key used to initialize the client and the specified public keys.

#### Parameters

##### message

`MessageDataType`

Message to sign and encrypt.

##### publicKeys

`string`[]

Array of public keys to use for encryption.

#### Returns

`Promise`\<`string`\>

Message signed and encrypted.

**Code example**

```ts
import { Encryption } from '@human-protocol/sdk';
import { EscrowClient } from '@human-protocol/sdk';

const privateKey = 'Armored_priv_key';
const passphrase = 'example_passphrase';
const encryption = await Encryption.build(privateKey, passphrase);
const publicKey1 = `-----BEGIN PGP PUBLIC KEY BLOCK-----
xjMEZKQEMxYJKwYBBAHaRw8BAQdA5oZTq4UPlS0IXn4kEaSqQdAa9+Cq522v
WYxJQn3vo1/NFEh1bWFuIDxodW1hbkBobXQuYWk+wowEEBYKAD4FAmSkBDME
CwkHCAkQJBFPuuhtQo4DFQgKBBYAAgECGQECGwMCHgEWIQTQ5fbVPB9CWIdf
XdYkEU+66G1CjgAAKYYA/jMyDCtJtqu6hj22kq9SW6fuV1FCT2ySJ9vBhumF
X8wWAP433zVFl4VECOkgGk8qFr8BgkYxaz16GOFAqYbfO6oMBc44BGSkBDMS
CisGAQQBl1UBBQEBB0AKR+A48zVVYZWQvgu7Opn2IGvzI9jePB/J8pzqRhg2
YAMBCAfCeAQYFggAKgUCZKQEMwkQJBFPuuhtQo4CGwwWIQTQ5fbVPB9CWIdf
XdYkEU+66G1CjgAA0xgBAK4AIahFFnmWR2Mp6A3q021cZXpGklc0Xw1Hfswc
UYLqAQDfdym4kiUvKO1+REKASt0Gwykndl7hra9txqlUL5DXBQ===Vwgv
-----END PGP PUBLIC KEY BLOCK-----`;

const publicKey2 = `-----BEGIN PGP PUBLIC KEY BLOCK-----
xjMEZKQEMxYJKwYBBAHaRw8BAQdAG6h+E+6T/RV2tIHer3FP/jKThAyGcoVx
FzhnP0hncPzNFEh1bWFuIDxodW1hbkBobXQuYWk+wowEEBYKAD4FAmSkBDME
CwkHCAkQPIq5xLhlTYkDFQgKBBYAAgECGQECGwMCHgEWIQTcxtMgul/AeUvH
bio8irnEuGVNiQAA/HsBANpfFkxNYixpsBk8LlaaCaPy5f1/cWNPgODM9uzo
ciSTAQDtAYynu4dSJO9GbMuDuc0FaUHRWJK3mS6JkvedYL4oBM44BGSkBDMS
CisGAQQBl1UBBQEBB0DWbEG7DMhkeSc8ZPzrH8XNSCqS3t9y/oQidFR+xN3Z
bAMBCAfCeAQYFggAKgUCZKQEMwkQPIq5xLhlTYkCGwwWIQTcxtMgul/AeUvH
bio8irnEuGVNiQAAqt8BAM/4Lw0RVOb0L5Ki9CyxO/6AKvRg4ra3Q3WR+duP
s/88AQCDErzvn+SOX4s3gvZcM3Vr4wh4Q2syHV8Okgx8STYPDg===DsVk
-----END PGP PUBLIC KEY BLOCK-----`;

const publicKeys = [publicKey1, publicKey2];
const resultMessage = await encryption.signAndEncrypt('message', publicKeys);
```

***

### build()

> `static` **build**(`privateKeyArmored`, `passphrase?`): `Promise`\<`Encryption`\>

Defined in: [encryption.ts:77](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L77)

Builds an Encryption instance by decrypting the private key from an encrypted private key and passphrase.

#### Parameters

##### privateKeyArmored

`string`

The encrypted private key in armored format.

##### passphrase?

`string`

Optional: The passphrase for the private key.

#### Returns

`Promise`\<`Encryption`\>

- The Encryption instance.
