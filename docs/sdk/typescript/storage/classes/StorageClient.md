[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [storage](../README.md) / StorageClient

# Class: ~~StorageClient~~

Defined in: [storage.ts:63](https://github.com/humanprotocol/human-protocol/blob/06afdec15d4185a13ccdd98fd231f6651db0e480/packages/sdk/typescript/human-protocol-sdk/src/storage.ts#L63)

## Deprecated

StorageClient is deprecated. Use Minio.Client directly.

## Introduction

This client enables interacting with S3 cloud storage services like Amazon S3 Bucket, Google Cloud Storage, and others.

The instance creation of `StorageClient` should be made using its constructor:

```ts
constructor(params: StorageParams, credentials?: StorageCredentials)
```

> If credentials are not provided, it uses anonymous access to the bucket for downloading files.

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

Defined in: [storage.ts:73](https://github.com/humanprotocol/human-protocol/blob/06afdec15d4185a13ccdd98fd231f6651db0e480/packages/sdk/typescript/human-protocol-sdk/src/storage.ts#L73)

**Storage client constructor**

#### Parameters

##### params

[`StorageParams`](../../types/type-aliases/StorageParams.md)

Cloud storage params

##### credentials?

[`StorageCredentials`](../../types/type-aliases/StorageCredentials.md)

Optional. Cloud storage access data. If credentials are not provided - use anonymous access to the bucket

#### Returns

[`StorageClient`](StorageClient.md)

## Methods

### ~~bucketExists()~~

> **bucketExists**(`bucket`): `Promise`\<`boolean`\>

Defined in: [storage.ts:262](https://github.com/humanprotocol/human-protocol/blob/06afdec15d4185a13ccdd98fd231f6651db0e480/packages/sdk/typescript/human-protocol-sdk/src/storage.ts#L262)

This function checks if a bucket exists.

#### Parameters

##### bucket

`string`

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

***

### ~~downloadFiles()~~

> **downloadFiles**(`keys`, `bucket`): `Promise`\<`any`[]\>

Defined in: [storage.ts:112](https://github.com/humanprotocol/human-protocol/blob/06afdec15d4185a13ccdd98fd231f6651db0e480/packages/sdk/typescript/human-protocol-sdk/src/storage.ts#L112)

This function downloads files from a bucket.

#### Parameters

##### keys

`string`[]

Array of filenames to download.

##### bucket

`string`

Bucket name.

#### Returns

`Promise`\<`any`[]\>

Returns an array of JSON files downloaded and parsed into objects.

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

***

### ~~listObjects()~~

> **listObjects**(`bucket`): `Promise`\<`string`[]\>

Defined in: [storage.ts:292](https://github.com/humanprotocol/human-protocol/blob/06afdec15d4185a13ccdd98fd231f6651db0e480/packages/sdk/typescript/human-protocol-sdk/src/storage.ts#L292)

This function lists all file names contained in the bucket.

#### Parameters

##### bucket

`string`

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

***

### ~~uploadFiles()~~

> **uploadFiles**(`files`, `bucket`): `Promise`\<[`UploadFile`](../../types/type-aliases/UploadFile.md)[]\>

Defined in: [storage.ts:198](https://github.com/humanprotocol/human-protocol/blob/06afdec15d4185a13ccdd98fd231f6651db0e480/packages/sdk/typescript/human-protocol-sdk/src/storage.ts#L198)

This function uploads files to a bucket.

#### Parameters

##### files

`any`[]

Array of objects to upload serialized into JSON.

##### bucket

`string`

Bucket name.

#### Returns

`Promise`\<[`UploadFile`](../../types/type-aliases/UploadFile.md)[]\>

Returns an array of uploaded file metadata.

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

***

### ~~downloadFileFromUrl()~~

> `static` **downloadFileFromUrl**(`url`): `Promise`\<`any`\>

Defined in: [storage.ts:146](https://github.com/humanprotocol/human-protocol/blob/06afdec15d4185a13ccdd98fd231f6651db0e480/packages/sdk/typescript/human-protocol-sdk/src/storage.ts#L146)

This function downloads files from a URL.

#### Parameters

##### url

`string`

URL of the file to download.

#### Returns

`Promise`\<`any`\>

Returns the JSON file downloaded and parsed into an object.

**Code example**

```ts
import { StorageClient } from '@human-protocol/sdk';

const file = await StorageClient.downloadFileFromUrl('http://localhost/file.json');
```
