import os
import unittest
from unittest.mock import Mock, patch
from validators import ValidationError

from human_protocol_sdk.utils import (
    _attach_indexer_id,
    _fetch_subgraph_data,
    SubgraphOptions,
    custom_gql_fetch,
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
        if "SUBGRAPH_API_KEY" in os.environ:
            del os.environ["SUBGRAPH_API_KEY"]

    def tearDown(self):
        if "SUBGRAPH_API_KEY" in os.environ:
            del os.environ["SUBGRAPH_API_KEY"]

    def test_returns_response_without_options(self):
        expected = {"data": {"ok": True}}
        with patch(
            "human_protocol_sdk.utils._fetch_subgraph_data",
            return_value=expected,
        ) as mock_fetch:
            result = custom_gql_fetch(self.network, self.query, self.variables)

        self.assertEqual(result, expected)
        mock_fetch.assert_called_once_with(self.network, self.query, self.variables)

    def test_retries_on_indexer_error_and_succeeds(self):
        options = SubgraphOptions(max_retries=2, base_delay=100)
        error = make_graphql_error({"errors": [{"message": "Bad indexers: syncing"}]})

        with patch(
            "human_protocol_sdk.utils._fetch_subgraph_data",
            side_effect=[error, {"data": {"ok": True}}],
        ) as mock_fetch, patch("human_protocol_sdk.utils.time.sleep") as mock_sleep:
            result = custom_gql_fetch(
                self.network, self.query, self.variables, options=options
            )

        self.assertEqual(result, {"data": {"ok": True}})
        self.assertEqual(mock_fetch.call_count, 2)
        mock_sleep.assert_called_once()

    def test_raises_when_retry_options_incomplete(self):
        options = SubgraphOptions(max_retries=2)

        with patch("human_protocol_sdk.utils._fetch_subgraph_data") as mock_fetch:
            with self.assertRaises(ValueError) as ctx:
                custom_gql_fetch(
                    self.network, self.query, self.variables, options=options
                )

        self.assertIn("max_retries", str(ctx.exception))
        mock_fetch.assert_not_called()

    def test_raises_immediately_on_non_indexer_error(self):
        options = SubgraphOptions(max_retries=3, base_delay=50)
        with patch(
            "human_protocol_sdk.utils._fetch_subgraph_data",
            side_effect=Exception("network failure"),
        ) as mock_fetch, patch("human_protocol_sdk.utils.time.sleep") as mock_sleep:
            with self.assertRaises(Exception) as ctx:
                custom_gql_fetch(
                    self.network, self.query, self.variables, options=options
                )

        self.assertIn("network failure", str(ctx.exception))
        mock_fetch.assert_called_once()
        mock_sleep.assert_not_called()

    def test_raises_after_exhausting_retries(self):
        options = SubgraphOptions(max_retries=2, base_delay=10)
        errors = [
            make_graphql_error({"errors": [{"message": "bad indexers: stalled"}]})
            for _ in range(3)
        ]

        with patch(
            "human_protocol_sdk.utils._fetch_subgraph_data",
            side_effect=errors,
        ) as mock_fetch, patch("human_protocol_sdk.utils.time.sleep"):
            with self.assertRaises(Exception) as ctx:
                custom_gql_fetch(
                    self.network, self.query, self.variables, options=options
                )

        self.assertTrue(is_indexer_error(ctx.exception))
        self.assertEqual(mock_fetch.call_count, 3)

    def test_routes_requests_to_specific_indexer(self):
        options = SubgraphOptions(indexer_id="0xabc123")
        expected = {"data": {"ok": True}}
        os.environ["SUBGRAPH_API_KEY"] = "secure-token"

        with patch(
            "human_protocol_sdk.utils._fetch_subgraph_data",
            return_value=expected,
        ) as mock_fetch:
            result = custom_gql_fetch(
                self.network, self.query, self.variables, options=options
            )

        self.assertEqual(result, expected)
        mock_fetch.assert_called_once_with(
            self.network, self.query, self.variables, "0xabc123"
        )

    def test_raises_when_indexer_without_api_key(self):
        options = SubgraphOptions(indexer_id="0xabc123")

        with self.assertRaises(ValueError) as ctx:
            custom_gql_fetch(self.network, self.query, self.variables, options)

        self.assertIn(
            "Routing requests to a specific indexer requires SUBGRAPH_API_KEY to be set",
            str(ctx.exception),
        )

    def test_fetch_subgraph_adds_authorization_header(self):
        network = {
            "subgraph_url": "http://subgraph",
            "subgraph_url_api_key": "http://subgraph-with-key",
        }

        with patch.dict(os.environ, {"SUBGRAPH_API_KEY": "token"}, clear=True):
            with patch("human_protocol_sdk.utils.requests.post") as mock_post:
                mock_post.return_value.status_code = 200
                mock_post.return_value.json.return_value = {"data": {}}

                _fetch_subgraph_data(network, self.query, self.variables)

        mock_post.assert_called_once()
        self.assertEqual(
            mock_post.call_args.kwargs.get("headers"),
            {"Authorization": "Bearer token"},
        )


class TestAttachIndexerId(unittest.TestCase):
    def test_converts_subgraph_path_to_deployment(self):
        base_url = "https://gateway.thegraph.com/api/key/deployments/id/Qm123"
        result = _attach_indexer_id(base_url, "0xabc")
        self.assertEqual(
            result,
            "https://gateway.thegraph.com/api/key/deployments/id/Qm123/indexers/id/0xabc",
        )

    def test_returns_original_url_when_indexer_missing(self):
        url = "https://gateway.thegraph.com/api/deployments/id/Qm123"
        self.assertEqual(_attach_indexer_id(url, None), url)
