Class for signing and decrypting messages.

The algorithm includes the implementation of the [PGP encryption algorithm](https://github.com/openpgpjs/openpgpjs) multi-public key encryption on typescript, and uses the vanilla [ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) implementation Schnorr signature for signatures and [curve25519](https://en.wikipedia.org/wiki/Curve25519) for encryption. [Learn more](https://wiki.polkadot.network/docs/learn-cryptography).

To get an instance of this class, initialization is recommended using the static [`build`](/ts/classes/Encryption/#build) method.

## Constructors

### Constructor

```ts
new Encryption(privateKey: PrivateKey): Encryption;
```

Constructor for the Encryption class.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `privateKey` | `PrivateKey` | The private key. |


#### Returns

| Type | Description |
|------|-------------|
| `Encryption` | - |

## Methods

### build()

```ts
static build(privateKeyArmored: string, passphrase?: string): Promise<Encryption>;
```

Builds an Encryption instance by decrypting the private key from an encrypted private key and passphrase.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `privateKeyArmored` | `string` | The encrypted private key in armored format. |
| `passphrase?` | `string` | The passphrase for the private key (optional). |


#### Returns

| Type | Description |
|------|-------------|
| `Encryption` | The Encryption instance. |

???+ example "Example"

    ```ts
    import { Encryption } from '@human-protocol/sdk';
    
    const privateKey = 'Armored_priv_key';
    const passphrase = 'example_passphrase';
    const encryption = await Encryption.build(privateKey, passphrase);
    ```


***

### signAndEncrypt()

```ts
signAndEncrypt(message: MessageDataType, publicKeys: string[]): Promise<string>;
```

This function signs and encrypts a message using the private key used to initialize the client and the specified public keys.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | [`MessageDataType`](../type-aliases/MessageDataType.md) | Message to sign and encrypt. |
| `publicKeys` | `string`[] | Array of public keys to use for encryption. |


#### Returns

| Type | Description |
|------|-------------|
| `string` | Message signed and encrypted. |

???+ example "Example"

    ```ts
    const publicKey1 = '-----BEGIN PGP PUBLIC KEY BLOCK-----...';
    const publicKey2 = '-----BEGIN PGP PUBLIC KEY BLOCK-----...';
    
    const publicKeys = [publicKey1, publicKey2];
    const resultMessage = await encryption.signAndEncrypt('message', publicKeys);
    console.log('Encrypted message:', resultMessage);
    ```


***

### decrypt()

```ts
decrypt(message: string, publicKey?: string): Promise<Uint8Array<ArrayBufferLike>>;
```

This function decrypts messages using the private key. In addition, the public key can be added for signature verification.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | Message to decrypt. |
| `publicKey?` | `string` | Public key used to verify signature if needed (optional). |


#### Returns

| Type | Description |
|------|-------------|
| `Promise<Uint8Array<ArrayBufferLike>>` | Message decrypted. |

#### Throws

| Type | Description |
|------|-------------|
| `Error` | If signature could not be verified when public key is provided |

???+ example "Example"

    ```ts
    const publicKey = '-----BEGIN PGP PUBLIC KEY BLOCK-----...';
    
    const resultMessage = await encryption.decrypt('message', publicKey);
    console.log('Decrypted message:', resultMessage);
    ```


***

### sign()

```ts
sign(message: string): Promise<string>;
```

This function signs a message using the private key used to initialize the client.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | Message to sign. |


#### Returns

| Type | Description |
|------|-------------|
| `string` | Message signed. |

???+ example "Example"

    ```ts
    const resultMessage = await encryption.sign('message');
    console.log('Signed message:', resultMessage);
    ```

