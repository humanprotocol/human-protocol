[@human-protocol/sdk](../README.md) / [Modules](../modules.md) / [encryption](../modules/encryption.md) / EncryptionUtils

# Class: EncryptionUtils

[encryption](../modules/encryption.md).EncryptionUtils

## Introduction

Utility class for encryption-related operations.

## Installation

### npm
```bash
npm install @human-protocol/sdk
```

### yarn
```bash
yarn install @human-protocol/sdk
```

## Code example

```ts
import { EncryptionUtils } from '@human-protocol/sdk';

const keyPair = await EncryptionUtils.generateKeyPair('Human', 'human@hmt.ai');
```

## Table of contents

### Constructors

- [constructor](encryption.EncryptionUtils.md#constructor)

### Methods

- [encrypt](encryption.EncryptionUtils.md#encrypt)
- [generateKeyPair](encryption.EncryptionUtils.md#generatekeypair)
- [getSignedData](encryption.EncryptionUtils.md#getsigneddata)
- [verify](encryption.EncryptionUtils.md#verify)

## Constructors

### constructor

• **new EncryptionUtils**()

## Methods

### encrypt

▸ `Static` **encrypt**(`message`, `publicKeys`): `Promise`<`string`\>

This function encrypts a message using the specified public keys.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `string` | Message to encrypt. |
| `publicKeys` | `string`[] | - |

#### Returns

`Promise`<`string`\>

Message encrypted.

**Code example**

```ts
import { EncryptionUtils } from '@human-protocol/sdk';

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

const publicKeys = [publicKey1, publicKey2]
const result = await EncriptionUtils.encrypt('message', publicKeys);
```

#### Defined in

[encryption.ts:422](https://github.com/humanprotocol/human-protocol/blob/d170338d/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L422)

___

### generateKeyPair

▸ `Static` **generateKeyPair**(`name`, `email`, `passphrase?`): `Promise`<`IKeyPair`\>

This function generates a key pair for encryption and decryption.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `name` | `string` | `undefined` | Name for the key pair. |
| `email` | `string` | `undefined` | Email for the key pair. |
| `passphrase` | `string` | `''` | Passphrase to encrypt the private key. Optional. |

#### Returns

`Promise`<`IKeyPair`\>

Key pair generated.

**Code example**

```ts
import { EncryptionUtils } from '@human-protocol/sdk';

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

const name = 'YOUR_NAME';
const email = 'YOUR_EMAIL';
const passphrase = 'YOUR_PASSPHRASE';
const result = await EncriptionUtils.generateKeyPair(name, email, passphrase);
```

#### Defined in

[encryption.ts:360](https://github.com/humanprotocol/human-protocol/blob/d170338d/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L360)

___

### getSignedData

▸ `Static` **getSignedData**(`message`): `Promise`<`string`\>

This function gets signed data from a signed message.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `string` | Message. |

#### Returns

`Promise`<`string`\>

Signed data.

**Code example**

```ts
import { EncryptionUtils } from '@human-protocol/sdk';

const signedData = await EncriptionUtils.getSignedData('message');
```

#### Defined in

[encryption.ts:317](https://github.com/humanprotocol/human-protocol/blob/d170338d/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L317)

___

### verify

▸ `Static` **verify**(`message`, `publicKey`): `Promise`<`boolean`\>

This function verifies the signature of a signed message using the public key.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `string` | Message to verify. |
| `publicKey` | `string` | Public key to verify that the message was sign by a specific source. |

#### Returns

`Promise`<`boolean`\>

True if verified. False if not verified.

**Code example**

```ts
import { EncryptionUtils } from '@human-protocol/sdk';

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

const result = await EncriptionUtils.verify('message', publicKey);
```

#### Defined in

[encryption.ts:284](https://github.com/humanprotocol/human-protocol/blob/d170338d/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L284)
