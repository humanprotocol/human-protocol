import unittest
from unittest.mock import Mock, patch
from validators import ValidationError

from human_protocol_sdk.utils import (
    SubgraphRetryConfig,
    get_data_from_subgraph,
    is_indexer_error,
    validate_url,
)


def make_graphql_error(payload, message=""):
    error = Exception(message or "GraphQL error")
    response = Mock()
    response.json.return_value = payload
    error.response = response
    return error


class TestStorageClient(unittest.TestCase):
    def test_validate_url_with_valid_url(self):
        self.assertTrue(validate_url("https://valid-url.tst/valid"))

    def test_validate_url_with_docker_network_url(self):
        self.assertTrue(validate_url("http://test:8000/valid"))

    def test_validate_url_with_invalid_url(self):
        self.assertIsInstance(validate_url("htt://test:8000/valid"), ValidationError)


class TestIsIndexerError(unittest.TestCase):
    def test_returns_true_for_graphql_response(self):
        error = make_graphql_error(
            {"errors": [{"message": "bad indexers: out of sync"}]}
        )
        self.assertTrue(is_indexer_error(error))

    def test_returns_true_for_message(self):
        error = Exception("bad indexers: [...]")
        self.assertTrue(is_indexer_error(error))

    def test_returns_false_when_not_indexer_error(self):
        error = Exception("some other issue")
        self.assertFalse(is_indexer_error(error))


class TestGetDataFromSubgraph(unittest.TestCase):
    def setUp(self):
        self.network = {
            "subgraph_url": "http://subgraph",
            "subgraph_url_api_key": "http://subgraph-with-key",
        }
        self.query = "query Test"
        self.variables = {"foo": "bar"}

    def test_returns_response_without_retry_config(self):
        expected = {"data": {"ok": True}}
        with patch(
            "human_protocol_sdk.utils._fetch_subgraph_data",
            return_value=expected,
        ) as mock_fetch:
            result = get_data_from_subgraph(self.network, self.query, self.variables)

        self.assertEqual(result, expected)
        mock_fetch.assert_called_once_with(self.network, self.query, self.variables)

    def test_retries_on_indexer_error_and_succeeds(self):
        retry_config = SubgraphRetryConfig(max_retries=2, base_delay=100)
        error = make_graphql_error({"errors": [{"message": "Bad indexers: syncing"}]})

        with patch(
            "human_protocol_sdk.utils._fetch_subgraph_data",
            side_effect=[error, {"data": {"ok": True}}],
        ) as mock_fetch, patch("human_protocol_sdk.utils.time.sleep") as mock_sleep:
            result = get_data_from_subgraph(
                self.network, self.query, self.variables, retry_config=retry_config
            )

        self.assertEqual(result, {"data": {"ok": True}})
        self.assertEqual(mock_fetch.call_count, 2)
        mock_sleep.assert_called_once()

    def test_raises_immediately_on_non_indexer_error(self):
        retry_config = SubgraphRetryConfig(max_retries=3, base_delay=50)
        with patch(
            "human_protocol_sdk.utils._fetch_subgraph_data",
            side_effect=Exception("network failure"),
        ) as mock_fetch, patch("human_protocol_sdk.utils.time.sleep") as mock_sleep:
            with self.assertRaises(Exception) as ctx:
                get_data_from_subgraph(
                    self.network, self.query, self.variables, retry_config=retry_config
                )

        self.assertIn("network failure", str(ctx.exception))
        mock_fetch.assert_called_once()
        mock_sleep.assert_not_called()

    def test_raises_after_exhausting_retries(self):
        retry_config = SubgraphRetryConfig(max_retries=2, base_delay=10)
        errors = [
            make_graphql_error({"errors": [{"message": "bad indexers: stalled"}]})
            for _ in range(3)
        ]

        with patch(
            "human_protocol_sdk.utils._fetch_subgraph_data",
            side_effect=errors,
        ) as mock_fetch, patch("human_protocol_sdk.utils.time.sleep"):
            with self.assertRaises(Exception) as ctx:
                get_data_from_subgraph(
                    self.network, self.query, self.variables, retry_config=retry_config
                )

        self.assertTrue(is_indexer_error(ctx.exception))
        self.assertEqual(mock_fetch.call_count, 3)
