import unittest
import uuid
from http import HTTPStatus
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from human_protocol_sdk.constants import Status

from src.db import Session, Base, engine, JobRequest, Statuses, Worker, AnnotationProject
from src.main import exchange_oracle, Endpoints, Errors

from src.cron_jobs import process_pending_job_requests
from test.utils import assert_http_error_response, assert_no_entries_in_db, random_address, random_username, \
    random_userinfo, is_valid_uuid, random_escrow_info

get_escrow_path = "human_protocol_sdk.escrow.EscrowUtils.get_escrow"
get_manifest_url_path = "src.cron_jobs.get_manifest_url"


class APITest(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(exchange_oracle)

        escrow_info, escrow_address, chain_id = random_escrow_info()
        self.escrow_address = escrow_address
        self.chain_id = chain_id
        self.message = escrow_info

        self.mock_escrow = MagicMock()
        self.mock_escrow.status = "Pending"
        self.mock_escrow.balance = 1

        Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)

    def tearDown(self):
        Base.metadata.drop_all(engine)

    @patch(get_escrow_path)
    def test_register_job_request(self, mock_get_escrow: MagicMock):
        """When a valid job request is posted to /job/request, a new pending Job Request should be added to the database and its id returned by the api."""
        mock_get_escrow.return_value = self.mock_escrow

        response = self.client.post(
            Endpoints.JOB_REQUEST,
            json=self.message,
            headers=None
        )

        mock_get_escrow.assert_called_once_with(self.chain_id, self.escrow_address)
        assert response.status_code == HTTPStatus.OK

        # check db status
        with Session() as session:
            job = session.query(JobRequest).where(
                JobRequest.id == response.json()["id"]
            ).one()

        assert job is not None
        assert job.status == Statuses.pending
        assert job.chain_id == self.chain_id
        assert job.escrow_address == self.escrow_address

    def test_register_job_request_failing_due_to_invalid_escrow_info(self):
        """When an invalid escrow info is posted to /job/request, an appropriate error response should be returned and NO Job Request should be added to the Database."""
        invalid_message = self.message.copy()
        invalid_message["chain_id"] = -100

        response = self.client.post(
            Endpoints.JOB_REQUEST,
            json=invalid_message
        )

        assert_http_error_response(response, Errors.ESCROW_INFO_INVALID)

        invalid_message = self.message.copy()
        invalid_message["escrow_address"] = "not_a_valid_adress"

        response = self.client.post(
            Endpoints.JOB_REQUEST,
            json=invalid_message
        )

        assert_http_error_response(response, Errors.ESCROW_INFO_INVALID)
        assert_no_entries_in_db(JobRequest)

    def test_register_job_request_failing_due_to_missing_escrow(self):
        """When an escrow info that points to no escrow is posted to /job/request, an appropriate error response should be returned and NO Job Request should be added to the Database."""

        with patch(get_escrow_path) as mock_get_escrow:
            mock_get_escrow.return_value = None

            response = self.client.post(
                Endpoints.JOB_REQUEST,
                json=self.message
            )

            mock_get_escrow.assert_called_once_with(self.chain_id, self.escrow_address)
            assert_http_error_response(response, Errors.ESCROW_NOT_FOUND)
            assert_no_entries_in_db(JobRequest)

    @patch(get_escrow_path)
    def test_register_job_request_failing_due_to_invalid_escrow(self, mock_get_escrow: MagicMock):
        """When an escrow info that points to an invalid escrow is posted to /job/request, an appropriate error response should be returned and NO Job Request should be added to the Database."""
        # insufficient funds
        mock_escrow = MagicMock()
        mock_escrow.balance = 0
        mock_escrow.status = "Pending"
        mock_get_escrow.return_value = mock_escrow

        response = self.client.post(
            Endpoints.JOB_REQUEST,
            json=self.message
        )

        mock_get_escrow.assert_called_once_with(self.chain_id, self.escrow_address)
        assert_http_error_response(response, Errors.ESCROW_VALIDATION_FAILED)
        assert_no_entries_in_db(JobRequest)

        # wrong status
        mock_escrow.balance = 1
        mock_escrow.status = Status.Complete.name
        response = self.client.post(
            Endpoints.JOB_REQUEST,
            json=self.message
        )

        assert_http_error_response(response, Errors.ESCROW_VALIDATION_FAILED)
        assert_no_entries_in_db(JobRequest)

    def test_list_available_jobs(self):
        """When a get request is made against /job/list, a list of uuids (v4) representing job ids of jobs in progress should be returned."""

        n_statuses = len(Statuses) - 1 # one will be valid, so deduct it
        n_returned_jobs = 3
        n_entries = n_statuses + n_returned_jobs

        with Session() as session:
            jobs = [JobRequest(escrow_address=random_address(), chain_id=self.chain_id, status=Statuses.in_progress.value) for _ in
                    range(n_entries)]

            # set to status other than in_progress
            for i, status in enumerate(Statuses):
                jobs[i].status = status

            session.add_all(jobs)
            session.commit()

        response = self.client.get(
            Endpoints.JOB_LIST
        )

        assert response.status_code == HTTPStatus.OK

        job_ids = response.json()
        assert len(job_ids) == n_returned_jobs
        assert all(is_valid_uuid(job_id) for job_id in job_ids)

    def test_register_user(self):
        """When a post request with appropriate UserRegistrationInfo is made against /user/register, a new user should be created and added as an annotator and doccano user."""

        user_info, worker_address, username = random_userinfo()

        response = self.client.post(
            Endpoints.USER_REGISTER,
            json=user_info
        )

        assert response.status_code == HTTPStatus.OK

        response_content = response.json()
        assert response_content["username"] == user_info["name"]
        assert response_content["password"] is not None

        with Session() as session:
            worker = session.query(Worker).where(Worker.id == worker_address).one()
        assert worker.is_validated

    def test_register_user_failing_due_to_wallett_already_registered(self):
        """When a post request containing an already registered wallett adress in UserRegistrationInfo is made against /user/register, an appropriate error response should be returned."""

        # normal registration
        user_info, worker_address, username = random_userinfo()
        response = self.client.post(
            Endpoints.USER_REGISTER,
            json=user_info
        )
        assert response.status_code == HTTPStatus.OK

        # same wallet, different username
        user_info["name"] = random_username()
        response = self.client.post(
            Endpoints.USER_REGISTER,
            json=user_info
        )
        assert_http_error_response(response, Errors.WORKER_ALREADY_REGISTERED)

    def test_register_user_failing_due_to_unavailable_username(self):
        """When a post request containing an unavailable username in UserRegistrationInfo is made against /user/register, an appropriate error response should be returned."""

        # normal registration
        user_info, worker_address, username = random_userinfo()
        response = self.client.post(
            Endpoints.USER_REGISTER,
            json=user_info
        )
        assert response.status_code == HTTPStatus.OK

        # same username, different wallet
        user_info["worker_address"] = random_address()
        response = self.client.post(
            Endpoints.USER_REGISTER,
            json=user_info
        )

        assert_http_error_response(response, Errors.WORKER_CREATION_FAILED)
        # make sure worker was NOT written to db
        with Session() as session:
            worker = session.query(Worker).where(Worker.id == user_info["worker_address"]).one_or_none()
        assert worker is None

    @patch(get_manifest_url_path)
    @patch(get_escrow_path)
    def test_job_application(self, mock_get_escrow: MagicMock, mock_get_manifest_url: MagicMock):
        """When a registered worker applies for a job that is in progress with a post request to /job/apply, they should be added to the project, the database should be updated and the result returned."""

        # worker registration, adds worker to db
        user_info, worker_address, username = random_userinfo()
        response = self.client.post(
            Endpoints.USER_REGISTER,
            json=user_info
        )
        assert response.status_code == HTTPStatus.OK
        authentication = response.json()

        # job registration, adds job to db
        mock_get_escrow.return_value = self.mock_escrow
        response = self.client.post(
            Endpoints.JOB_REQUEST,
            json=self.message,
            headers=None
        )
        mock_get_escrow.assert_called_once_with(self.chain_id, self.escrow_address)
        assert response.status_code == HTTPStatus.OK
        job_id = response.json()["id"]

        # TODO: needs to be set up manually for tests, better to mock?
        # set up projects for jobs
        mock_get_manifest_url.return_value = "http://127.0.0.1:9000/text-exo/manifest.json"
        process_pending_job_requests()
        mock_get_manifest_url.assert_called_once()

        # make sure all projects have been created successfully
        response = self.client.get(Endpoints.JOB_LIST)
        available_jobs = response.json()
        assert len(available_jobs) > 0
        assert job_id in available_jobs
        with Session() as session:
            projects = session.query(AnnotationProject).where(AnnotationProject.job_request_id == job_id).all()
        assert len(projects) > 0

        response = self.client.post(
            Endpoints.JOB_APPLY,
            json={"worker_id": worker_address, "job_id": job_id}
        )
        assert response.status_code == HTTPStatus.OK

        response_content = response.json()
        assert response_content["username"] == username
        assert response_content["password"] is not None
        assert response_content["url"] is not None

        with Session() as session:
            session.query(AnnotationProject).where((AnnotationProject.job_request_id == job_id) & (AnnotationProject.worker_id == worker_address)).one()

    def test_job_application_failing_due_to_missing_worker_or_job(self):
        """When a job application contains an invalid worker address or job id, an appropriate error should be returned and the entities should not be linked."""
        _, worker_address, username = random_userinfo()
        job_id = str(uuid.uuid4())

        with Session() as session:
            session.add(Worker(id=worker_address, is_validated=True, username=username, password="password1234"))
            session.commit()

        response = self.client.post(
            Endpoints.JOB_APPLY,
            json={"worker_id": worker_address, "job_id": job_id}
        )
        assert_http_error_response(response, Errors.JOB_OR_WORKER_MISSING)

        with Session() as session:
            session.add(JobRequest(id=job_id, escrow_address=self.escrow_address, chain_id=self.chain_id, status=Statuses.in_progress))
            session.commit()

        response = self.client.post(
            Endpoints.JOB_APPLY,
            json={"worker_id": random_address(), "job_id": job_id}
        )
        assert_http_error_response(response, Errors.JOB_OR_WORKER_MISSING)

    def test_job_application_failing_due_to_unvalidated_worker(self):
        """When a job application contains an unvalidated worker, an appropriate error should be returned and the entities should not be linked."""
        _, worker_address, username = random_userinfo()
        job_id = str(uuid.uuid4())

        with Session() as session:
            session.add(Worker(id=worker_address, is_validated=False, username=username, password="password1234"))
            session.add(JobRequest(id=job_id, escrow_address=self.escrow_address, chain_id=self.chain_id, status=Statuses.in_progress))
            session.commit()

        response = self.client.post(
            Endpoints.JOB_APPLY,
            json={"worker_id": worker_address, "job_id": job_id}
        )
        assert_http_error_response(response, Errors.WORKER_NOT_VALIDATED)

    def test_job_application_failing_due_to_unavailable_job(self):
        """When a job application includes a job that is not in the right status, an appropriate error should be returned and the entities should not be linked."""
        _, worker_address, username = random_userinfo()
        job_id = str(uuid.uuid4())

        with Session() as session:
            session.add(Worker(id=worker_address, is_validated=True, username=username, password="password1234"))
            session.add(JobRequest(id=job_id, escrow_address=self.escrow_address, chain_id=self.chain_id))
            session.commit()

        response = self.client.post(
            Endpoints.JOB_APPLY,
            json={"worker_id": worker_address, "job_id": job_id}
        )
        assert_http_error_response(response, Errors.JOB_UNAVAILABLE)

    def test_job_application_failing_due_to_worker_assignment_error(self):
        """When a job application includes a job that is not in the right status, an appropriate error should be returned and the entities should not be linked."""
        _, worker_address, username = random_userinfo()
        job_id = str(uuid.uuid4())
        anno_project_id = job_id + '__1'
        with Session() as session:
            session.add(Worker(id=worker_address, is_validated=True, username="DOES_NOT_EXIST", password="password1234"))
            jr = JobRequest(id=job_id, escrow_address=self.escrow_address, chain_id=self.chain_id, status=Statuses.in_progress)
            session.add(jr)
            session.add(AnnotationProject(id=1, name=anno_project_id, job_request=jr))
            session.commit()

        response = self.client.post(
            Endpoints.JOB_APPLY,
            json={"worker_id": worker_address, "job_id": job_id}
        )

        assert_http_error_response(response, Errors.WORKER_ASSIGNMENT_FAILED)


if __name__ == '__main__':
    unittest.main()
