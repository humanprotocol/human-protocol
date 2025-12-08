Utility class for encryption-related operations.

## Methods

### verify()

```ts
static verify(message: string, publicKey: string): Promise<boolean>;
```

This function verifies the signature of a signed message using the public key.

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | Message to verify. |
| `publicKey` | `string` | Public key to verify that the message was signed by a specific source. |

#### Returns

| Type | Description |
|------|-------------|
| `boolean` | True if verified. False if not verified. |

???+ example "Example"

    ```ts
    import { EncryptionUtils } from '@human-protocol/sdk';
    
    const publicKey = '-----BEGIN PGP PUBLIC KEY BLOCK-----...';
    const result = await EncryptionUtils.verify('message', publicKey);
    console.log('Verification result:', result);
    ```


***

### getSignedData()

```ts
static getSignedData(message: string): Promise<string>;
```

This function gets signed data from a signed message.

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | Message. |

#### Returns

| Type | Description |
|------|-------------|
| `string` | Signed data. |

#### Throws

| Type | Description |
|------|-------------|
| `Error` | If data could not be extracted from the message |

???+ example "Example"

    ```ts
    import { EncryptionUtils } from '@human-protocol/sdk';
    
    const signedData = await EncryptionUtils.getSignedData('message');
    console.log('Signed data:', signedData);
    ```


***

### generateKeyPair()

```ts
static generateKeyPair(
   name: string, 
   email: string, 
passphrase: string): Promise<IKeyPair>;
```

This function generates a key pair for encryption and decryption.

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `name` | `string` | `undefined` | Name for the key pair. |
| `email` | `string` | `undefined` | Email for the key pair. |
| `passphrase` | `string` | `''` | Passphrase to encrypt the private key (optional, defaults to empty string). |

#### Returns

| Type | Description |
|------|-------------|
| `IKeyPair` | Key pair generated. |

???+ example "Example"

    ```ts
    import { EncryptionUtils } from '@human-protocol/sdk';
    
    const name = 'YOUR_NAME';
    const email = 'YOUR_EMAIL';
    const passphrase = 'YOUR_PASSPHRASE';
    const keyPair = await EncryptionUtils.generateKeyPair(name, email, passphrase);
    console.log('Public key:', keyPair.publicKey);
    ```


***

### encrypt()

```ts
static encrypt(message: MessageDataType, publicKeys: string[]): Promise<string>;
```

This function encrypts a message using the specified public keys.

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | [`MessageDataType`](../type-aliases/MessageDataType.md) | Message to encrypt. |
| `publicKeys` | `string`[] | Array of public keys to use for encryption. |

#### Returns

| Type | Description |
|------|-------------|
| `string` | Message encrypted. |

???+ example "Example"

    ```ts
    import { EncryptionUtils } from '@human-protocol/sdk';
    
    const publicKey1 = '-----BEGIN PGP PUBLIC KEY BLOCK-----...';
    const publicKey2 = '-----BEGIN PGP PUBLIC KEY BLOCK-----...';
    const publicKeys = [publicKey1, publicKey2];
    const encryptedMessage = await EncryptionUtils.encrypt('message', publicKeys);
    console.log('Encrypted message:', encryptedMessage);
    ```


***

### isEncrypted()

```ts
static isEncrypted(message: string): boolean;
```

Verifies if a message appears to be encrypted with OpenPGP.

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | Message to verify. |

#### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the message appears to be encrypted, `false` if not. |

???+ example "Example"

    ```ts
    import { EncryptionUtils } from '@human-protocol/sdk';
    
    const message = '-----BEGIN PGP MESSAGE-----...';
    const isEncrypted = EncryptionUtils.isEncrypted(message);
    
    if (isEncrypted) {
      console.log('The message is encrypted with OpenPGP.');
    } else {
      console.log('The message is not encrypted with OpenPGP.');
    }
    ```

