[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [types](../README.md) / StorageParams

# Type Alias: ~~StorageParams~~

> **StorageParams**: `object`

Defined in: [types.ts:54](https://github.com/humanprotocol/human-protocol/blob/508a14bc6124efbce87c3168c916200b52bfc694/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L54)

## Type declaration

### ~~endPoint~~

> **endPoint**: `string`

Request endPoint

### ~~port?~~

> `optional` **port**: `number`

TCP/IP port number. Default value set to 80 for HTTP and 443 for HTTPs

### ~~region?~~

> `optional` **region**: `string`

Region

### ~~useSSL~~

> **useSSL**: `boolean`

Enable secure (HTTPS) access. Default value set to false

## Deprecated

StorageClient is deprecated. Use Minio.Client directly.
