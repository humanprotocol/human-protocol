[**@human-protocol/sdk**](../../README.md) • **Docs**

***

[@human-protocol/sdk](../../modules.md) / [types](../README.md) / StorageParams

# Type Alias: ~~StorageParams~~

> **StorageParams**: `object`

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

## Defined in

[types.ts:52](https://github.com/humanprotocol/human-protocol/blob/9ddd51f9c9a3ec97c56d6ffbca5fe9048b9ea0f8/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L52)