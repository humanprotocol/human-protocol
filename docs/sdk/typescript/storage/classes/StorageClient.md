[**@human-protocol/sdk**](../../README.md) • **Docs**

***

[@human-protocol/sdk](../../modules.md) / [storage](../README.md) / StorageClient

# Class: ~~StorageClient~~

## Deprecated

StorageClient is deprecated. Use Minio.Client directly.

## Introduction

This client enables to interact with S3 cloud storage services like Amazon S3 Bucket, Google Cloud Storage and others.

The instance creation of `StorageClient` should be made using its constructor:

```ts
constructor(params: StorageParams, credentials?: StorageCredentials)
```

> If credentials is not provided, it uses an anonymous access to the bucket for downloading files.

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
import { StorageClient, StorageCredentials, StorageParams } from '@human-protocol/sdk';

const credentials: StorageCredentials = {
  accessKey: 'ACCESS_KEY',
  secretKey: 'SECRET_KEY',
};
const params: StorageParams = {
  endPoint: 'http://localhost',
  port: 9000,
  useSSL: false,
  region: 'us-east-1'
};

const storageClient = new StorageClient(params, credentials);
```

## Constructors

### new StorageClient()

> **new StorageClient**(`params`, `credentials`?): [`StorageClient`](StorageClient.md)

**Storage client constructor**

#### Parameters

• **params**: `StorageParams`

Cloud storage params

• **credentials?**: `StorageCredentials`

Optional. Cloud storage access data. If credentials is not provided - use an anonymous access to the bucket

#### Returns

[`StorageClient`](StorageClient.md)

#### Source

[storage.ts:73](https://github.com/humanprotocol/human-protocol/blob/8d975cea1abbae7bc4c000b3bf81cca8faa7415f/packages/sdk/typescript/human-protocol-sdk/src/storage.ts#L73)

## Properties

### ~~client~~

> `private` **client**: `Client`

#### Source

[storage.ts:64](https://github.com/humanprotocol/human-protocol/blob/8d975cea1abbae7bc4c000b3bf81cca8faa7415f/packages/sdk/typescript/human-protocol-sdk/src/storage.ts#L64)

***

### ~~clientParams~~

> `private` **clientParams**: `StorageParams`

#### Source

[storage.ts:65](https://github.com/humanprotocol/human-protocol/blob/8d975cea1abbae7bc4c000b3bf81cca8faa7415f/packages/sdk/typescript/human-protocol-sdk/src/storage.ts#L65)

## Methods

### ~~bucketExists()~~

> **bucketExists**(`bucket`): `Promise`\<`boolean`\>

This function checks if a bucket exists.

#### Parameters

• **bucket**: `string`

Bucket name.

#### Returns

`Promise`\<`boolean`\>

Returns `true` if exists, `false` if it doesn't.

**Code example**

```ts
import { StorageClient, StorageCredentials, StorageParams } from '@human-protocol/sdk';

const credentials: StorageCredentials = {
  accessKey: 'ACCESS_KEY',
  secretKey: 'SECRET_KEY',
};
const params: StorageParams = {
  endPoint: 'http://localhost',
  port: 9000,
  useSSL: false,
  region: 'us-east-1'
};

const storageClient = new StorageClient(params, credentials);
const exists = await storageClient.bucketExists('bucket-name');
```

#### Source

[storage.ts:266](https://github.com/humanprotocol/human-protocol/blob/8d975cea1abbae7bc4c000b3bf81cca8faa7415f/packages/sdk/typescript/human-protocol-sdk/src/storage.ts#L266)

***

### ~~downloadFiles()~~

> **downloadFiles**(`keys`, `bucket`): `Promise`\<`any`[]\>

This function downloads files from a bucket.

#### Parameters

• **keys**: `string`[]

Array of filenames to download.

• **bucket**: `string`

Bucket name.

#### Returns

`Promise`\<`any`[]\>

Returns an array of json files downloaded and parsed into objects.

**Code example**

```ts
import { StorageClient, StorageCredentials, StorageParams } from '@human-protocol/sdk';

const params: StorageParams = {
  endPoint: 'http://localhost',
  port: 9000,
  useSSL: false,
  region: 'us-east-1'
};

const storageClient = new StorageClient(params);

const keys = ['file1.json', 'file2.json'];
const files = await storageClient.downloadFiles(keys, 'bucket-name');
```

#### Source

[storage.ts:113](https://github.com/humanprotocol/human-protocol/blob/8d975cea1abbae7bc4c000b3bf81cca8faa7415f/packages/sdk/typescript/human-protocol-sdk/src/storage.ts#L113)

***

### ~~listObjects()~~

> **listObjects**(`bucket`): `Promise`\<`string`[]\>

This function list all file names contained in the bucket.

#### Parameters

• **bucket**: `string`

Bucket name.

#### Returns

`Promise`\<`string`[]\>

Returns the list of file names contained in the bucket.

**Code example**

```ts
import { StorageClient, StorageCredentials, StorageParams } from '@human-protocol/sdk';

const credentials: StorageCredentials = {
  accessKey: 'ACCESS_KEY',
  secretKey: 'SECRET_KEY',
};
const params: StorageParams = {
  endPoint: 'http://localhost',
  port: 9000,
  useSSL: false,
  region: 'us-east-1'
};

const storageClient = new StorageClient(params, credentials);
const fileNames = await storageClient.listObjects('bucket-name');
```

#### Source

[storage.ts:297](https://github.com/humanprotocol/human-protocol/blob/8d975cea1abbae7bc4c000b3bf81cca8faa7415f/packages/sdk/typescript/human-protocol-sdk/src/storage.ts#L297)

***

### ~~uploadFiles()~~

> **uploadFiles**(`files`, `bucket`): `Promise`\<`UploadFile`[]\>

This function uploads files to a bucket.

#### Parameters

• **files**: `any`[]

Array of objects to upload serialized into json.

• **bucket**: `string`

Bucket name.

#### Returns

`Promise`\<`UploadFile`[]\>

Returns an array of json files downloaded and parsed into objects.

**Code example**

```ts
import { StorageClient, StorageCredentials, StorageParams } from '@human-protocol/sdk';

const credentials: StorageCredentials = {
  accessKey: 'ACCESS_KEY',
  secretKey: 'SECRET_KEY',
};
const params: StorageParams = {
  endPoint: 'http://localhost',
  port: 9000,
  useSSL: false,
  region: 'us-east-1'
};

const storageClient = new StorageClient(params, credentials);
const file1 = { name: 'file1', description: 'description of file1' };
const file2 = { name: 'file2', description: 'description of file2' };
const files = [file1, file2];
const uploadedFiles = await storageClient.uploadFiles(files, 'bucket-name');
```

#### Source

[storage.ts:201](https://github.com/humanprotocol/human-protocol/blob/8d975cea1abbae7bc4c000b3bf81cca8faa7415f/packages/sdk/typescript/human-protocol-sdk/src/storage.ts#L201)

***

### ~~downloadFileFromUrl()~~

> `static` **downloadFileFromUrl**(`url`): `Promise`\<`any`\>

This function downloads files from a Url.

#### Parameters

• **url**: `string`

Url of the file to download.

#### Returns

`Promise`\<`any`\>

Returns the JSON file downloaded and parsed into object.

**Code example**

```ts
import { StorageClient } from '@human-protocol/sdk';

const file = await storageClient.downloadFileFromUrl('http://localhost/file.json');
```

#### Source

[storage.ts:148](https://github.com/humanprotocol/human-protocol/blob/8d975cea1abbae7bc4c000b3bf81cca8faa7415f/packages/sdk/typescript/human-protocol-sdk/src/storage.ts#L148)
