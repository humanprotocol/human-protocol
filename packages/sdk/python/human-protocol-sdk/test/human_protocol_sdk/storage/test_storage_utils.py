import unittest
from unittest.mock import patch

from human_protocol_sdk.storage import StorageUtils, StorageClientError
import requests


class TestStorageUtils(unittest.TestCase):
    def test_download_file_from_url(self):
        with patch("requests.get") as mock_get:
            mock_response = mock_get.return_value
            mock_response.raise_for_status.return_value = None
            mock_response.content = b"Test file content"
            url = "https://www.example.com/file.txt"

            result = StorageUtils.download_file_from_url(url)

            self.assertEqual(result, b"Test file content")

    def test_download_file_from_url_invalid_url(self):
        url = "invalid_url"

        with self.assertRaises(StorageClientError) as cm:
            StorageUtils.download_file_from_url(url)
        self.assertEqual(f"Invalid URL: {url}", str(cm.exception))

    def test_download_file_from_url_error(self):
        with patch("requests.get") as mock_get:
            url = "https://www.example.com/file.txt"
            mock_response = mock_get.return_value
            mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(
                f"Not Found for url: {url}", response=mock_response
            )

            with self.assertRaises(StorageClientError) as cm:
                StorageUtils.download_file_from_url(url)
            self.assertEqual(f"Not Found for url: {url}", str(cm.exception))
