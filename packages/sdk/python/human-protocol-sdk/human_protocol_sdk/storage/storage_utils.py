"""
Utility class for storage-related operations.
"""

import logging
import os
from warnings import warn

import requests

from human_protocol_sdk.storage.storage_client import StorageClientError
from human_protocol_sdk.utils import validate_url

logging.getLogger("minio").setLevel(logging.INFO)

DEBUG = "true" in os.getenv("DEBUG", "false").lower()
LOG = logging.getLogger("human_protocol_sdk.storage")
LOG.setLevel(logging.DEBUG if DEBUG else logging.INFO)


warn(f"The module {__name__} is deprecated.", DeprecationWarning, stacklevel=2)


class StorageUtils:
    """
    Utility class for storage-related operations.
    """

    @staticmethod
    def download_file_from_url(url: str) -> bytes:
        """
        Downloads a file from the specified URL.

        :param url: The URL of the file to download.

        :return: The content of the downloaded file.

        :raise StorageClientError: If an error occurs while downloading the file.

        :example:
            .. code-block:: python

                from human_protocol_sdk.storage import StorageClient

                result = StorageClient.download_file_from_url(
                    "https://www.example.com/file.txt"
                )
        """
        if not validate_url(url):
            raise StorageClientError(f"Invalid URL: {url}")

        try:
            response = requests.get(url)
            response.raise_for_status()

            return response.content
        except Exception as e:
            raise StorageClientError(str(e))
