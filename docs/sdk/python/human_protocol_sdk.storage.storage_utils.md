# human_protocol_sdk.storage.storage_utils module

Utility class for storage-related operations.

### *class* human_protocol_sdk.storage.storage_utils.StorageUtils

Bases: `object`

Utility class for storage-related operations.

#### *static* download_file_from_url(url)

Downloads a file from the specified URL.

* **Parameters:**
  **url** (`str`) – The URL of the file to download.
* **Return type:**
  `bytes`
* **Returns:**
  The content of the downloaded file.
* **Raises:**
  [**StorageClientError**](human_protocol_sdk.storage.storage_client.md#human_protocol_sdk.storage.storage_client.StorageClientError) – If an error occurs while downloading the file.
* **Example:**
  ```python
  from human_protocol_sdk.storage import StorageUtils

  result = StorageUtils.download_file_from_url(
      "https://www.example.com/file.txt"
  )
  ```
