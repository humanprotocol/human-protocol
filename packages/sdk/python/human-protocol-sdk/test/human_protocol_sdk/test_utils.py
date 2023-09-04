import unittest
from validators.utils import ValidationFailure

from human_protocol_sdk.utils import validate_url


class TestStorageClient(unittest.TestCase):
    def test_validate_url_with_valid_url(self):
        self.assertTrue(validate_url("https://valid-url.tst/valid"))

    def test_validate_url_with_docker_network_url(self):
        self.assertTrue(validate_url("http://test:8000/valid"))

    def test_validate_url_with_invalid_url(self):
        assert isinstance(validate_url("htt://test:8000/valid"), ValidationFailure)
