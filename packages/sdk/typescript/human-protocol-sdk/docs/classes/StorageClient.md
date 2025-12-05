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

### Constructor

```ts
new StorageClient(params: StorageParams, credentials?: StorageCredentials): StorageClient;
```

**Storage client constructor**

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`StorageParams`](../type-aliases/StorageParams.md) | Cloud storage params |
| `credentials?` | [`StorageCredentials`](../type-aliases/StorageCredentials.md) | Optional. Cloud storage access data. If credentials are not provided - use anonymous access to the bucket |

#### Returns

| Type | Description |
|------|-------------|
| `StorageClient` | - |

## Methods

### ~~downloadFiles()~~

```ts
downloadFiles(keys: string[], bucket: string): Promise<any[]>;
```

This function downloads files from a bucket.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `keys` | `string`[] | Array of filenames to download. |
| `bucket` | `string` | Bucket name. |

#### Returns

| Type | Description |
|------|-------------|
| `any[]` | Returns an array of JSON files downloaded and parsed into objects. |

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

### ~~downloadFileFromUrl()~~

```ts
static downloadFileFromUrl(url: string): Promise<any>;
```

This function downloads files from a URL.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `url` | `string` | URL of the file to download. |

#### Returns

| Type | Description |
|------|-------------|
| `any` | Returns the JSON file downloaded and parsed into an object. |

**Code example**

```ts
import { StorageClient } from '@human-protocol/sdk';

const file = await StorageClient.downloadFileFromUrl('http://localhost/file.json');
```

***

### ~~uploadFiles()~~

```ts
uploadFiles(files: any[], bucket: string): Promise<UploadFile[]>;
```

This function uploads files to a bucket.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `files` | `any`[] | Array of objects to upload serialized into JSON. |
| `bucket` | `string` | Bucket name. |

#### Returns

| Type | Description |
|------|-------------|
| `[UploadFile](../type-aliases/UploadFile.md)[]` | Returns an array of uploaded file metadata. |

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

### ~~bucketExists()~~

```ts
bucketExists(bucket: string): Promise<boolean>;
```

This function checks if a bucket exists.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `bucket` | `string` | Bucket name. |

#### Returns

| Type | Description |
|------|-------------|
| `boolean` | Returns `true` if exists, `false` if it doesn't. |

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

### ~~listObjects()~~

```ts
listObjects(bucket: string): Promise<string[]>;
```

This function lists all file names contained in the bucket.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `bucket` | `string` | Bucket name. |

#### Returns

| Type | Description |
|------|-------------|
| `string[]` | Returns the list of file names contained in the bucket. |

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
