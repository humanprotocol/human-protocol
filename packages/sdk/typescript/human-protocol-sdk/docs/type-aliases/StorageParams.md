```ts
type StorageParams = object;
```

## Deprecated

StorageClient is deprecated. Use Minio.Client directly.

## Properties

### ~~endPoint~~

```ts
endPoint: string;
```

Request endPoint

***

### ~~useSSL~~

```ts
useSSL: boolean;
```

Enable secure (HTTPS) access. Default value set to false

***

### ~~region?~~

```ts
optional region: string;
```

Region

***

### ~~port?~~

```ts
optional port: number;
```

TCP/IP port number. Default value set to 80 for HTTP and 443 for HTTPs
