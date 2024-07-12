[**@human-protocol/sdk**](../../README.md) • **Docs**

***

[@human-protocol/sdk](../../modules.md) / [encryption](../README.md) / EncryptionUtils

# Class: EncryptionUtils

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

## Constructors

### new EncryptionUtils()

> **new EncryptionUtils**(): [`EncryptionUtils`](EncryptionUtils.md)

#### Returns

[`EncryptionUtils`](EncryptionUtils.md)

## Methods

### encrypt()

> `static` **encrypt**(`message`, `publicKeys`): `Promise`\<`string`\>

This function encrypts a message using the specified public keys.

#### Parameters

• **message**: `string`

Message to encrypt.

• **publicKeys**: `string`[]

#### Returns

`Promise`\<`string`\>

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

#### Source

[encryption.ts:422](https://github.com/humanprotocol/human-protocol/blob/8d975cea1abbae7bc4c000b3bf81cca8faa7415f/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L422)

***

### generateKeyPair()

> `static` **generateKeyPair**(`name`, `email`, `passphrase`): `Promise`\<`IKeyPair`\>

This function generates a key pair for encryption and decryption.

#### Parameters

• **name**: `string`

Name for the key pair.

• **email**: `string`

Email for the key pair.

• **passphrase**: `string`= `''`

Passphrase to encrypt the private key. Optional.

#### Returns

`Promise`\<`IKeyPair`\>

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

#### Source

[encryption.ts:360](https://github.com/humanprotocol/human-protocol/blob/8d975cea1abbae7bc4c000b3bf81cca8faa7415f/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L360)

***

### getSignedData()

> `static` **getSignedData**(`message`): `Promise`\<`string`\>

This function gets signed data from a signed message.

#### Parameters

• **message**: `string`

Message.

#### Returns

`Promise`\<`string`\>

Signed data.

**Code example**

```ts
import { EncryptionUtils } from '@human-protocol/sdk';

const signedData = await EncriptionUtils.getSignedData('message');
```

#### Source

[encryption.ts:317](https://github.com/humanprotocol/human-protocol/blob/8d975cea1abbae7bc4c000b3bf81cca8faa7415f/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L317)

***

### isEncrypted()

> `static` **isEncrypted**(`message`): `boolean`

Verifies if a message appears to be encrypted with OpenPGP.

#### Parameters

• **message**: `string`

Message to verify.

#### Returns

`boolean`

`true` if the message appears to be encrypted, `false` if not.

**Code example:**

```ts
const message = `-----BEGIN PGP MESSAGE-----

wV4DqdeRpqH+jaISAQdAsvBFxikvjxRqC7ZlDe98cLd7/aeCEI/AcL8PpVKK
mC0wKlwxNg/ADi55z9jcYFuMC4kKE+C/teM+JqiI8DO9AwassQUvKFtULnpx
h2jaOjC/0sAQASjUsIFK8zbuDgk/P8T9Npn6px+GlJPg9K90iwtPWiIp0eyW
4zXamJZT51k2DyaUX/Rsc6P4PYhQRKjt0yxtH0jHPmKkLC/9eBeFf4GP0zlZ
18xMZ8uCpQCma708Gz0sJYxEz3u/eZdHD7Mc7tWQKyJG8MsTwM1P+fdK1X75
L9UryJG2AY+6kKZhG4dqjNxiO4fWluiB2u7iMF+iLEyE3SQCEYorWMC+NDWi
QIJZ7oQ2w7BaPo1a991gvTOSNm5v2x44KfqPI1uj859BjsQTCA==
=tsmI
-----END PGP MESSAGE-----`;

const isEncrypted = await EncriptionUtils.isEncrypted(message);

if (isEncrypted) {
  console.log('The message is encrypted with OpenPGP.');
} else {
  console.log('The message is not encrypted with OpenPGP.');
}
```

#### Source

[encryption.ts:471](https://github.com/humanprotocol/human-protocol/blob/8d975cea1abbae7bc4c000b3bf81cca8faa7415f/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L471)

***

### verify()

> `static` **verify**(`message`, `publicKey`): `Promise`\<`boolean`\>

This function verifies the signature of a signed message using the public key.

#### Parameters

• **message**: `string`

Message to verify.

• **publicKey**: `string`

Public key to verify that the message was sign by a specific source.

#### Returns

`Promise`\<`boolean`\>

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

#### Source

[encryption.ts:284](https://github.com/humanprotocol/human-protocol/blob/8d975cea1abbae7bc4c000b3bf81cca8faa7415f/packages/sdk/typescript/human-protocol-sdk/src/encryption.ts#L284)
