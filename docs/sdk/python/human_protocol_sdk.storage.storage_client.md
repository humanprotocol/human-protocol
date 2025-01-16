# human_protocol_sdk.storage.storage_client module

This client enables to interact with S3 cloud storage services like Amazon S3 Bucket,
Google Cloud Storage and others.

If credentials are not provided, anonymous access will be used (for downloading files).

## Code Example

```python
from human_protocol_sdk.storage import (
    Credentials,
    StorageClient,
)

credentials = Credentials(
    access_key="my-access-key",
    secret_key="my-secret-key",
)

storage_client = StorageClient(
    endpoint_url="s3.us-west-2.amazonaws.com",
    region="us-west-2",
    credentials=credentials,
)
```

## Module

### *class* human_protocol_sdk.storage.storage_client.Credentials(access_key, secret_key)

Bases: `object`

A class to represent the credentials required to authenticate with an S3-compatible service.

Example:

```default
credentials = Credentials(
    access_key='my-access-key',
    secret_key='my-secret-key'
)
```

#### \_\_init_\_(access_key, secret_key)

Initializes a Credentials instance.

* **Parameters:**
  * **access_key** (`str`) – The access key for the S3-compatible service.
  * **secret_key** (`str`) – The secret key for the S3-compatible service.

### *class* human_protocol_sdk.storage.storage_client.StorageClient(endpoint_url, region=None, credentials=None, secure=True)

Bases: `object`

A class for downloading files from an S3-compatible service.

* **Attribute:**
  - client (Minio): The S3-compatible client used for interacting with the service.
* **Example:**
  ```python
  # Download a list of files from an S3-compatible service
  client = StorageClient(
      endpoint_url='https://s3.us-west-2.amazonaws.com',
      region='us-west-2',
      credentials=Credentials(
          access_key='my-access-key',
          secret_key='my-secret-key'
      )
  )
  files = ['file1.txt', 'file2.txt']
  bucket = 'my-bucket'
  result_files = client.download_files(files=files, bucket=bucket)
  ```

#### \_\_init_\_(endpoint_url, region=None, credentials=None, secure=True)

Initializes the StorageClient with the given endpoint_url, region, and credentials.

If credentials are not provided, anonymous access will be used.

* **Parameters:**
  * **endpoint_url** (`str`) – The URL of the S3-compatible service.
  * **region** (`Optional`[`str`]) – The region of the S3-compatible service. Defaults to None.
  * **credentials** (`Optional`[[`Credentials`](#human_protocol_sdk.storage.storage_client.Credentials)]) – The credentials required to authenticate with the S3-compatible service.
    Defaults to None for anonymous access.
  * **secure** (`Optional`[`bool`]) – Flag to indicate to use secure (TLS) connection to S3 service or not.
    Defaults to True.

#### bucket_exists(bucket)

Check if a given bucket exists.

* **Parameters:**
  **bucket** (`str`) – The name of the bucket to check.
* **Return type:**
  `bool`
* **Returns:**
  True if the bucket exists, False otherwise.
* **Raises:**
  [**StorageClientError**](#human_protocol_sdk.storage.storage_client.StorageClientError) – If an error occurs while checking the bucket.
* **Example:**
  ```python
  from human_protocol_sdk.storage import (
      Credentials,
      StorageClient,
  )

  credentials = Credentials(
      access_key="my-access-key",
      secret_key="my-secret-key",
  )

  storage_client = StorageClient(
      endpoint_url="s3.us-west-2.amazonaws.com",
      region="us-west-2",
      credentials=credentials,
  )

  is_exists = storage_client.bucket_exists(
      bucket = "my-bucket"
  )
  ```

#### download_files(files, bucket)

Downloads a list of files from the specified S3-compatible bucket.

* **Parameters:**
  * **files** (`List`[`str`]) – A list of file keys to download.
  * **bucket** (`str`) – The name of the S3-compatible bucket to download from.
* **Return type:**
  `List`[`bytes`]
* **Returns:**
  A list of file contents (bytes) downloaded from the bucket.
* **Raises:**
  * [**StorageClientError**](#human_protocol_sdk.storage.storage_client.StorageClientError) – If an error occurs while downloading the files.
  * [**StorageFileNotFoundError**](#human_protocol_sdk.storage.storage_client.StorageFileNotFoundError) – If one of the specified files is not found in the bucket.
* **Example:**
  ```python
  from human_protocol_sdk.storage import (
      Credentials,
      StorageClient,
  )

  credentials = Credentials(
      access_key="my-access-key",
      secret_key="my-secret-key",
  )

  storage_client = StorageClient(
      endpoint_url="s3.us-west-2.amazonaws.com",
      region="us-west-2",
      credentials=credentials,
  )

  result = storage_client.download_files(
      files = ["file1.txt", "file2.txt"],
      bucket = "my-bucket"
  )
  ```

#### list_objects(bucket)

Return a list of all objects in a given bucket.

* **Parameters:**
  **bucket** (`str`) – The name of the bucket to list objects from.
* **Return type:**
  `List`[`str`]
* **Returns:**
  A list of object keys in the given bucket.
* **Raises:**
  [**StorageClientError**](#human_protocol_sdk.storage.storage_client.StorageClientError) – If an error occurs while listing the objects.
* **Example:**
  ```python
  from human_protocol_sdk.storage import (
      Credentials,
      StorageClient,
  )

  credentials = Credentials(
      access_key="my-access-key",
      secret_key="my-secret-key",
  )

  storage_client = StorageClient(
      endpoint_url="s3.us-west-2.amazonaws.com",
      region="us-west-2",
      credentials=credentials,
  )

  result = storage_client.list_objects(
      bucket = "my-bucket"
  )
  ```

#### upload_files(files, bucket)

Uploads a list of files to the specified S3-compatible bucket.

* **Parameters:**
  * **files** (`List`[`dict`]) – A list of files to upload.
  * **bucket** (`str`) – The name of the S3-compatible bucket to upload to.
* **Return type:**
  `List`[`dict`]
* **Returns:**
  List of dict with key, url, hash fields
* **Raises:**
  [**StorageClientError**](#human_protocol_sdk.storage.storage_client.StorageClientError) – If an error occurs while uploading the files.
* **Example:**
  ```python
  from human_protocol_sdk.storage import (
      Credentials,
      StorageClient,
  )

  credentials = Credentials(
      access_key="my-access-key",
      secret_key="my-secret-key",
  )

  storage_client = StorageClient(
      endpoint_url="s3.us-west-2.amazonaws.com",
      region="us-west-2",
      credentials=credentials,
  )

  result = storage_client.upload_files(
      files = [{"file": "file content", "key": "file1.txt", "hash": "hash1"}],
      bucket = "my-bucket"
  )
  ```

### *exception* human_protocol_sdk.storage.storage_client.StorageClientError

Bases: `Exception`

Raises when some error happens when interacting with storage.

### *exception* human_protocol_sdk.storage.storage_client.StorageFileNotFoundError

Bases: [`StorageClientError`](#human_protocol_sdk.storage.storage_client.StorageClientError)

Raises when some error happens when file is not found by its key.
