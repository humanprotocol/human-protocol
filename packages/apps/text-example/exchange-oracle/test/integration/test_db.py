import unittest
from unittest.mock import patch, MagicMock

from src.config import Config
from src.db import (
    Statuses,
    stage_success,
    stage_failure,
    Session,
    JobRequest,
    Base,
    engine,
)
from test.utils import add_job_request


class MyTestCase(unittest.TestCase):
    def setUp(self):
        Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)

    def tearDown(self):
        Base.metadata.drop_all(engine)

    def test_job_request_retry_policy_success(self):
        """When a job request succeeds at a given stage:
        - Its status should be advanced to match the next stage.
        - Its attempts should be set to 0.
        """
        job_id = add_job_request(Statuses.pending, attempts=1)

        with Session() as session:
            job = session.query(JobRequest).where(JobRequest.id == job_id).one()
            stage_success(job)
            session.commit()

        with Session() as session:
            job = session.query(JobRequest).where(JobRequest.id == job_id).one()
            assert job.status == Statuses.in_progress
            assert job.attempts == 0

    @patch("src.config.Config")
    def test_job_request_retry_policy_failure(self, mock_config: MagicMock):
        """When a job request fails at a given stage:
        - Its attempts should be increased by 1.
        - If attempts exceed Config.max_attempts, the request status should be set to failed.
        """
        mock_config.max_attempts = 2

        initial_status = Statuses.pending
        start_attempts = Config.max_attempts - 2
        job_id = add_job_request(initial_status, attempts=start_attempts)

        with Session() as session:
            job = session.query(JobRequest).where(JobRequest.id == job_id).one()
            stage_failure(job)
            session.commit()

            job = session.query(JobRequest).where(JobRequest.id == job_id).one()
            assert job.status == initial_status
            assert job.attempts == start_attempts + 1
            stage_failure(job)
            session.commit()

            assert job.status == Statuses.failed
            session.commit()


if __name__ == "__main__":
    unittest.main()
