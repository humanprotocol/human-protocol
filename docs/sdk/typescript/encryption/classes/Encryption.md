[**@human-protocol/sdk**](../../README.md) • **Docs**

***

[@human-protocol/sdk](../../modules.md) / [encryption](../README.md) / Encryption

# Class: Encryption

## Introduction

Class for sign and decrypt messages.

The algorithm includes the implementation of the [PGP encryption algorithm](https://github.com/openpgpjs/openpgpjs) multi-public key encryption on typescript.
Using the vanilla [ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) implementation Schnorr signatures for signature and [curve25519](https://en.wikipedia.org/wiki/Curve25519) for encryption. [Learn more](https://wiki.polkadot.network/docs/learn-cryptography).

To get an instance of this class, is recommended to initialize it using the static `build` method.

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
const encription = await Encryption.build(privateKey, passphrase);
```

## Constructors

### new Encryption()

> **new Encryption**(`privateKey`): [`Encryption`](Encryption.md)

Constructor for the Encryption class.

#### Parameters

• **privateKey**: `PrivateKey`

The private key.

#### Returns

[`Encryption`](Encryption.md)

#### Source

[encryption.ts:53](https://github.com/humanprotocol/human-protocol/blob/00c0ef1cd5e15fe55363c28d74cb730c10dfa5a9/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L53)

## Properties

### privateKey

> `private` **privateKey**: `PrivateKey`

#### Source

[encryption.ts:46](https://github.com/humanprotocol/human-protocol/blob/00c0ef1cd5e15fe55363c28d74cb730c10dfa5a9/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L46)

## Methods

### decrypt()

> **decrypt**(`message`, `publicKey`?): `Promise`\<`string`\>

This function decrypt message message using the private key. In addition, the public key can be added for signature verification.

#### Parameters

• **message**: `string`

Message to decrypt.

• **publicKey?**: `string`

Public key used to verify signature if needed. Optional.

#### Returns

`Promise`\<`string`\>

Message decrypted.

**Code example**

```ts
import { Encryption } from '@human-protocol/sdk';

const privateKey = 'Armored_priv_key';
const passphrase = 'example_passphrase';
const encription = await Encryption.build(privateKey, passphrase);

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

const resultMessage = await encription.decrypt('message');
```

#### Source

[encryption.ts:180](https://github.com/humanprotocol/human-protocol/blob/00c0ef1cd5e15fe55363c28d74cb730c10dfa5a9/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L180)

***

### sign()

> **sign**(`message`): `Promise`\<`string`\>

This function signs a message using the private key used to initialize the client.

#### Parameters

• **message**: `string`

Message to sign.

#### Returns

`Promise`\<`string`\>

Message signed.

**Code example**

```ts
import { Encryption } from '@human-protocol/sdk';

const privateKey = 'Armored_priv_key';
const passphrase = 'example_passphrase';
const encription = await Encryption.build(privateKey, passphrase);

const resultMessage = await encription.sign('message');
```

#### Source

[encryption.ts:217](https://github.com/humanprotocol/human-protocol/blob/00c0ef1cd5e15fe55363c28d74cb730c10dfa5a9/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L217)

***

### signAndEncrypt()

> **signAndEncrypt**(`message`, `publicKeys`): `Promise`\<`string`\>

This function signs and encrypts a message using the private key used to initialize the client and the specified public keys.

#### Parameters

• **message**: `string`

Message to sign and encrypt.

• **publicKeys**: `string`[]

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
const encription = await Encryption.build(privateKey, passphrase);
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
const resultMessage = await encription.signAndEncrypt('message', publicKeys);
```

#### Source

[encryption.ts:129](https://github.com/humanprotocol/human-protocol/blob/00c0ef1cd5e15fe55363c28d74cb730c10dfa5a9/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L129)

***

### build()

> `static` **build**(`privateKeyArmored`, `passphrase`?): `Promise`\<[`Encryption`](Encryption.md)\>

Builds an Encryption instance by decrypting the private key from an encrypted private key and passphrase.

#### Parameters

• **privateKeyArmored**: `string`

The encrypted private key in armored format.

• **passphrase?**: `string`

Optional: The passphrase for the private key.

#### Returns

`Promise`\<[`Encryption`](Encryption.md)\>

- The Encryption instance.

#### Source

[encryption.ts:64](https://github.com/humanprotocol/human-protocol/blob/00c0ef1cd5e15fe55363c28d74cb730c10dfa5a9/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L64)
