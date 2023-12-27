import unittest
import uuid

from src.config import Config
from src.cron_jobs import process_pending_requests
from src.db import Base, engine, Session, ResultsProcessingRequest, Statuses
from test.utils import random_address, add_processing_request


class APITest(unittest.TestCase):
    def setUp(self):
        Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)

    def tearDown(self):
        Base.metadata.drop_all(engine)

    def test_process_pending_requests(self):
        """When pending requests are processed successfully:
        - The request's status should be set to "awaiting_upload"
        - A file with the intermediate results should be stored in local storage.
        """
        id = add_processing_request()

        process_pending_requests()

        with Session() as session:
            request = session.query(ResultsProcessingRequest).one()

        assert str(request.id) == id
        assert (Config.storage_config.dataset_dir / f"{id}.json").exists()
        assert request.status == Statuses.awaiting_upload
