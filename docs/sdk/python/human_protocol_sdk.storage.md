# human_protocol_sdk.storage package

This modules contains an s3 client and utilities for files sharing.

## Submodules

* [human_protocol_sdk.storage.storage_client module](human_protocol_sdk.storage.storage_client.md)
  * [Code Example](human_protocol_sdk.storage.storage_client.md#code-example)
  * [Module](human_protocol_sdk.storage.storage_client.md#module)
  * [`Credentials`](human_protocol_sdk.storage.storage_client.md#human_protocol_sdk.storage.storage_client.Credentials)
    * [`Credentials.__init__()`](human_protocol_sdk.storage.storage_client.md#human_protocol_sdk.storage.storage_client.Credentials.__init__)
  * [`StorageClient`](human_protocol_sdk.storage.storage_client.md#human_protocol_sdk.storage.storage_client.StorageClient)
    * [`StorageClient.__init__()`](human_protocol_sdk.storage.storage_client.md#human_protocol_sdk.storage.storage_client.StorageClient.__init__)
    * [`StorageClient.bucket_exists()`](human_protocol_sdk.storage.storage_client.md#human_protocol_sdk.storage.storage_client.StorageClient.bucket_exists)
    * [`StorageClient.download_files()`](human_protocol_sdk.storage.storage_client.md#human_protocol_sdk.storage.storage_client.StorageClient.download_files)
    * [`StorageClient.list_objects()`](human_protocol_sdk.storage.storage_client.md#human_protocol_sdk.storage.storage_client.StorageClient.list_objects)
    * [`StorageClient.upload_files()`](human_protocol_sdk.storage.storage_client.md#human_protocol_sdk.storage.storage_client.StorageClient.upload_files)
  * [`StorageClientError`](human_protocol_sdk.storage.storage_client.md#human_protocol_sdk.storage.storage_client.StorageClientError)
  * [`StorageFileNotFoundError`](human_protocol_sdk.storage.storage_client.md#human_protocol_sdk.storage.storage_client.StorageFileNotFoundError)
* [human_protocol_sdk.storage.storage_utils module](human_protocol_sdk.storage.storage_utils.md)
  * [`StorageUtils`](human_protocol_sdk.storage.storage_utils.md#human_protocol_sdk.storage.storage_utils.StorageUtils)
    * [`StorageUtils.download_file_from_url()`](human_protocol_sdk.storage.storage_utils.md#human_protocol_sdk.storage.storage_utils.StorageUtils.download_file_from_url)
