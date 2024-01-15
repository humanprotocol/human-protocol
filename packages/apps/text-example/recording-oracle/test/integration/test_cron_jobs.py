import json
import unittest
from unittest.mock import patch, MagicMock

from src.config import Config
from src.cron_jobs import (
    process_pending_requests,
    upload_intermediate_results,
    notify_reputation_oracle,
)
from src.db import Base, engine, Session, ResultsProcessingRequest, Statuses
from test.utils import (
    add_processing_request,
    get_web3_from_private_key,
    upload_manifest_and_annotations,
)


class CronJobTest(unittest.TestCase):
    def setUp(self):
        Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)

    def tearDown(self):
        Base.metadata.drop_all(engine)

    @patch("src.cron_jobs.get_manifest_url")
    def test_process_pending_requests(self, mock_get_manifest_url: MagicMock):
        """When pending requests are processed successfully:
        - The request's status should be set to "awaiting_upload"
        - A file with the intermediate results should be stored in local storage.
        """
        id = add_processing_request()
        manifest_url = upload_manifest_and_annotations()
        mock_get_manifest_url.return_value = manifest_url

        process_pending_requests()

        with Session() as session:
            request = session.query(ResultsProcessingRequest).one()

        assert str(request.id) == id
        assert (Config.storage_config.dataset_dir / f"{id}.json").exists()
        assert request.status == Statuses.awaiting_upload

    @patch("src.cron_jobs.get_manifest_url")
    @patch("src.cron_jobs.download_manifest")
    def test_process_pending_requests_without_ground_truth(
        self, mock_download_manifest: MagicMock, mock_get_manifest_url: MagicMock
    ):
        """When pending requests are processed successfully:
        - The request's status should be set to "awaiting_upload"
        - A file with the intermediate results should be stored in local storage.

        In this test, a manifest without ground truth information is tested.
        """
        mock_manifest = MagicMock()
        mock_manifest.groundtruth_uri = None
        mock_download_manifest.return_value = mock_manifest

        id = add_processing_request()
        upload_manifest_and_annotations()

        process_pending_requests()

        with Session() as session:
            request = session.query(ResultsProcessingRequest).one()

        assert str(request.id) == id
        assert (Config.storage_config.dataset_dir / f"{id}.json").exists()
        assert request.status == Statuses.awaiting_upload

    @patch("src.cron_jobs.EscrowClient")
    def test_upload_intermediate_results(self, mock_escrow_client: MagicMock):
        """When intermediate results are uploaded successfully:
        - intermediate results
        - The request's status should be set to "completed"
        - A file with the intermediate results should be deleted.
        """
        id = add_processing_request(status=Statuses.awaiting_upload)
        path = Config.storage_config.dataset_dir / f"{id}.json"
        Config.storage_config.dataset_dir.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump({"annotations": []}, f)

        upload_intermediate_results()

        with Session() as session:
            request = session.query(ResultsProcessingRequest).one()

        assert not path.exists()
        assert request.status == Statuses.awaiting_closure
        assert (
            Config.storage_config.client().stat_object(
                Config.storage_config.results_bucket_name, path.name
            )
            is not None
        )

    @patch("src.cron_jobs.Config.http.request")
    def test_notify_reputation_oracle(self, mock_request: MagicMock):
        mock_response = MagicMock()
        mock_response.status = 200
        mock_request.return_value = mock_response

        id = add_processing_request(status=Statuses.awaiting_closure)

        notify_reputation_oracle()

        with Session() as session:
            request = session.query(ResultsProcessingRequest).one()

        assert request.status == Statuses.closed
