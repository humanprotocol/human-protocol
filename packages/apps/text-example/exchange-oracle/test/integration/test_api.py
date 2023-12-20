import unittest
import uuid
from http import HTTPStatus
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from human_protocol_sdk.constants import Status

from src.annotation import get_client
from src.chain import EscrowInfo, EventType
from src.config import Config
from src.cron_jobs import process_pending_job_requests
from src.db import (
    AnnotationProject,
    Base,
    JobRequest,
    Session,
    Statuses,
    Worker,
    engine,
)
from src.endpoints import Endpoints, Errors
from src.main import exchange_oracle
from test.constants import JOB_LAUNCHER
from test.utils import (
    assert_http_error_response,
    assert_no_entries_in_db,
    is_valid_uuid,
    random_address,
    random_escrow_info,
    random_userinfo,
    random_username,
    upload_manifest_and_task_data,
    add_job_request,
)

get_escrow_path = "human_protocol_sdk.escrow.EscrowUtils.get_escrow"
get_manifest_url_path = "src.cron_jobs.get_manifest_url"
get_web3_path = "src.chain.get_web3"


class APITest(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(exchange_oracle)

        escrow_info, escrow_address, chain_id = random_escrow_info()
        self.escrow_address = escrow_address
        self.chain_id = chain_id
        self.message = escrow_info

        self.human_signature = {"Signature": Config.human.human_app_signature}
        self.job_launcher = JOB_LAUNCHER
        self.job_launcher_signature = {
            "Signature": self.job_launcher.sign(self.message)
        }

        self.mock_escrow = MagicMock()
        self.mock_escrow.status = "Pending"
        self.mock_escrow.balance = 1
        self.mock_escrow.launcher = JOB_LAUNCHER.address

        Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)

    def tearDown(self):
        Base.metadata.drop_all(engine)

    @patch(get_escrow_path)
    def test_register_job_request(self, mock_get_escrow: MagicMock):
        """When a valid job request is posted:
        - a new pending Job Request should be added to the database
        - its id returned by the api
        """
        mock_get_escrow.return_value = self.mock_escrow

        response = self.client.post(
            Endpoints.JOB_REQUEST,
            json=self.message,
            headers=self.job_launcher_signature,
        )

        assert response.status_code == HTTPStatus.OK
        mock_get_escrow.assert_called_once_with(self.chain_id, self.escrow_address)

        # check db status
        with Session() as session:
            job = session.query(JobRequest).one()

        assert job is not None
        assert job.status == Statuses.pending
        assert job.chain_id == self.chain_id
        assert job.escrow_address == self.escrow_address

    def test_register_job_request_failing_due_to_invalid_escrow_info(self):
        """When an invalid escrow info is posted:
        - an appropriate error response should be returned
        - NO Job Request should be added to the database.
        """
        invalid_message = self.message.copy()
        invalid_message["chain_id"] = -100

        response = self.client.post(
            Endpoints.JOB_REQUEST,
            json=invalid_message,
            headers={"Signature": self.job_launcher.sign(message=invalid_message)},
        )

        assert_http_error_response(response, Errors.ESCROW_INFO_INVALID)

        invalid_message = self.message.copy()
        invalid_message["escrow_address"] = "not_a_valid_adress"

        response = self.client.post(
            Endpoints.JOB_REQUEST,
            json=invalid_message,
            headers={"Signature": self.job_launcher.sign(message=invalid_message)},
        )

        assert_http_error_response(response, Errors.ESCROW_INFO_INVALID)
        assert_no_entries_in_db(JobRequest)

    @patch(get_escrow_path)
    def test_register_job_request_failing_due_to_missing_escrow(
        self, mock_get_escrow: MagicMock
    ):
        """When a job request with an escrow info that points to no escrow is posted:
        - an appropriate error response should be returned
        - NO Job Request should be added to the database
        """
        mock_get_escrow.return_value = None

        response = self.client.post(
            Endpoints.JOB_REQUEST,
            json=self.message,
            headers=self.job_launcher_signature,
        )

        mock_get_escrow.assert_called_once_with(self.chain_id, self.escrow_address)
        assert_http_error_response(response, Errors.ESCROW_NOT_FOUND)
        assert_no_entries_in_db(JobRequest)

    @patch(get_escrow_path)
    def test_register_job_request_failing_due_to_invalid_escrow(
        self, mock_get_escrow: MagicMock
    ):
        """When a job request with an escrow info that points to an invalid escrow is posted:
        - an appropriate error response should be returned
        - NO Job Request should be added to the database
        """
        # insufficient funds
        mock_escrow = MagicMock()
        mock_escrow.balance = 0
        mock_escrow.status = "Pending"
        mock_get_escrow.return_value = mock_escrow

        response = self.client.post(
            Endpoints.JOB_REQUEST,
            json=self.message,
            headers=self.job_launcher_signature,
        )

        mock_get_escrow.assert_called_once_with(self.chain_id, self.escrow_address)
        assert_http_error_response(response, Errors.ESCROW_VALIDATION_FAILED)
        assert_no_entries_in_db(JobRequest)

        # escrow with wrong status should fail in validation
        mock_escrow.balance = 1
        mock_escrow.status = Status.Complete.name
        response = self.client.post(
            Endpoints.JOB_REQUEST,
            json=self.message,
            headers=self.job_launcher_signature,
        )

        assert_http_error_response(response, Errors.ESCROW_VALIDATION_FAILED)
        assert_no_entries_in_db(JobRequest)

    @patch(get_escrow_path)
    def test_cancel_job_request(self, mock_get_escrow: MagicMock):
        add_job_request(
            status=Statuses.in_progress,
            escrow_address=self.escrow_address,
            chain_id=self.chain_id,
        )
        mock_get_escrow.return_value = self.mock_escrow

        message = self.message.copy()
        message["event_type"] = EventType.ESCROW_CANCELED
        header = {"Signature": self.job_launcher.sign(message)}

        response = self.client.post(
            Endpoints.JOB_REQUEST,
            json=message,
            headers=header,
        )

        assert response.status_code == HTTPStatus.OK

        with Session() as session:
            job = session.query(JobRequest).one()
            assert job.status == Statuses.completed

    def test_list_available_jobs(self):
        """When a list of available jobs is requested:
        - a list of job information for jobs in progress should be returned
        - each information object should contain the job id and the job type
        """
        n_statuses = len(Statuses) - 1  # one will be valid, so deduct it
        n_returned_jobs = 3
        n_entries = n_statuses + n_returned_jobs

        with Session() as session:
            jobs = [
                JobRequest(
                    escrow_address=random_address(),
                    chain_id=self.chain_id,
                    status=Statuses.in_progress.value,
                )
                for _ in range(n_entries)
            ]

            # set to status other than in_progress
            for i, status in enumerate(Statuses):
                jobs[i].status = status

            session.add_all(jobs)
            session.commit()

        response = self.client.get(
            Endpoints.JOB_LIST + f"?chainId={self.chain_id}",
            headers=self.human_signature,
        )

        assert response.status_code == HTTPStatus.OK
        jobs = response.json()
        assert len(jobs) == n_returned_jobs
        assert all(
            is_valid_uuid(job["jobId"]) and job["jobType"] is not None for job in jobs
        )

    def test_job_details(self):
        """When details for an available job are requested:
        - job details should be returned
        - details should include the job's id, type, description, reward and reward token.
        """
        job_id = add_job_request(Statuses.in_progress)

        response = self.client.get(
            Endpoints.JOB_DETAIL + f"?jobId={job_id}", headers=self.human_signature
        )
        assert response.status_code == HTTPStatus.OK

        details: dict = response.json()
        assert all(
            key in details
            for key in [
                "jobId",
                "jobType",
                "jobDescription",
                "rewardAmount",
                "rewardToken",
            ]
        )

    def test_job_details_due_to_missing_job(self):
        """When details for a job that is not availabel are requested:
        - an appropriate error response should be raised
        """
        job_id = add_job_request(Statuses.pending)

        response = self.client.get(
            Endpoints.JOB_DETAIL + f"?jobId={job_id}", headers=self.human_signature
        )

        assert_http_error_response(response, Errors.NOTHING_FOUND)

    def test_register_user(self):
        """When a valid user registration is posted:
        - a new Worker should be created and added to the db
        - a new doccano annotator should be created with the given username and a secure password
        - the user credentials should be returned with the response
        """

        user_info, worker_address, username = random_userinfo()

        response = self.client.post(
            Endpoints.USER_REGISTER, json=user_info, headers=self.human_signature
        )

        # check response
        assert response.status_code == HTTPStatus.OK
        response_content = response.json()
        assert response_content["username"] == user_info["name"]
        assert response_content["password"] is not None

        # check db
        with Session() as session:
            worker = session.query(Worker).where(Worker.id == worker_address).one()
        assert worker.is_validated

        # check db
        doccano_client = get_client()
        doccano_client.find_user_by_name(user_info["name"])

    def test_register_user_failing_due_to_wallett_already_registered(self):
        """When it is attempted to register a user with the same wallet address as an existing user:
        - an appropriate error response should be returned
        - no new worker should be added to the db
        - no new worker should be added to doccano
        """

        # normal registration
        user_info, worker_address, username = random_userinfo()
        response = self.client.post(
            Endpoints.USER_REGISTER, json=user_info, headers=self.human_signature
        )
        assert response.status_code == HTTPStatus.OK

        # same wallet, different username
        user_info["name"] = random_username()
        response = self.client.post(
            Endpoints.USER_REGISTER, json=user_info, headers=self.human_signature
        )
        assert_http_error_response(response, Errors.WORKER_ALREADY_REGISTERED)

    def test_register_user_failing_due_to_unavailable_username(self):
        """When it is attempted to register a user with the same username as an existing user:
        - an appropriate error response should be returned
        - no new worker should be added to the db
        """

        # normal registration
        user_info, worker_address, username = random_userinfo()
        response = self.client.post(
            Endpoints.USER_REGISTER, json=user_info, headers=self.human_signature
        )
        assert response.status_code == HTTPStatus.OK

        # same username, different wallet
        user_info["worker_address"] = random_address()
        response = self.client.post(
            Endpoints.USER_REGISTER, json=user_info, headers=self.human_signature
        )

        assert_http_error_response(response, Errors.WORKER_CREATION_FAILED)

        # make sure worker was NOT written to db
        with Session() as session:
            worker = (
                session.query(Worker)
                .where(Worker.id == user_info["worker_address"])
                .one_or_none()
            )
        assert worker is None

    @patch(get_manifest_url_path)
    @patch(get_escrow_path)
    def test_job_application(
        self, mock_get_escrow: MagicMock, mock_get_manifest_url: MagicMock
    ):
        """When applying for an available job with an existing worker
        - the worker should be added to the project
        - the database should be updated
        - a response with the username and the link to the annotation tool should be returned
        """
        # worker registration, adds worker to db
        user_info, worker_address, username = random_userinfo()
        response = self.client.post(
            Endpoints.USER_REGISTER, json=user_info, headers=self.human_signature
        )
        assert response.status_code == HTTPStatus.OK

        # job registration, adds job to db
        mock_get_escrow.return_value = self.mock_escrow
        response = self.client.post(
            Endpoints.JOB_REQUEST,
            json=self.message,
            headers=self.job_launcher_signature,
        )
        mock_get_escrow.assert_called_once_with(self.chain_id, self.escrow_address)
        assert response.status_code == HTTPStatus.OK

        # upload manifest and data
        manifest_s3_url = upload_manifest_and_task_data()

        # set up projects for jobs
        mock_get_manifest_url.return_value = manifest_s3_url
        process_pending_job_requests()
        mock_get_manifest_url.assert_called_once()

        # make sure job was created and all projects have been created successfully
        response = self.client.get(
            Endpoints.JOB_LIST + f"?chainId={self.chain_id}",
            headers=self.human_signature,
        )
        available_jobs = response.json()
        assert len(available_jobs) == 1
        job_id = available_jobs[0]["jobId"]
        with Session() as session:
            job = session.query(JobRequest).where(JobRequest.id == job_id).one()
            projects = job.projects
            assert job.status == Statuses.in_progress
            assert len(projects) != 0

        response = self.client.post(
            Endpoints.JOB_APPLY,
            json={"worker_id": worker_address, "job_id": job_id},
            headers=self.human_signature,
        )
        assert response.status_code == HTTPStatus.OK

        response_content = response.json()
        assert response_content["username"] == username
        assert response_content["password"] is not None
        assert response_content["url"] is not None

        with Session() as session:
            session.query(AnnotationProject).where(
                (AnnotationProject.job_request_id == job_id)
                & (AnnotationProject.worker_id == worker_address)
            ).one()

    def test_job_application_failing_due_to_missing_worker_or_job(self):
        """When applying for an unavailable job or a worker that does not exist:
        - an appropriate error should be returned
        - the entities should not be linked
        """
        _, worker_address, username = random_userinfo()
        job_id = str(uuid.uuid4())

        with Session() as session:
            session.add(
                Worker(
                    id=worker_address,
                    is_validated=True,
                    username=username,
                    password="password1234",
                )
            )
            session.commit()

        response = self.client.post(
            Endpoints.JOB_APPLY,
            json={"worker_id": worker_address, "job_id": job_id},
            headers=self.human_signature,
        )
        assert_http_error_response(response, Errors.JOB_OR_WORKER_MISSING)

        with Session() as session:
            session.add(
                JobRequest(
                    id=job_id,
                    escrow_address=self.escrow_address,
                    chain_id=self.chain_id,
                    status=Statuses.in_progress,
                )
            )
            session.commit()

        response = self.client.post(
            Endpoints.JOB_APPLY,
            json={"worker_id": random_address(), "job_id": job_id},
            headers=self.human_signature,
        )
        assert_http_error_response(response, Errors.JOB_OR_WORKER_MISSING)

    def test_job_application_failing_due_to_unvalidated_worker(self):
        """When applying for an available job with a worker that was not validated:
        - an appropriate error should be returned
        - the entities should not be linked
        """
        _, worker_address, username = random_userinfo()
        job_id = str(uuid.uuid4())

        with Session() as session:
            session.add(
                Worker(
                    id=worker_address,
                    is_validated=False,
                    username=username,
                    password="password1234",
                )
            )
            session.add(
                JobRequest(
                    id=job_id,
                    escrow_address=self.escrow_address,
                    chain_id=self.chain_id,
                    status=Statuses.in_progress,
                )
            )
            session.commit()

        response = self.client.post(
            Endpoints.JOB_APPLY,
            json={"worker_id": worker_address, "job_id": job_id},
            headers=self.human_signature,
        )
        assert_http_error_response(response, Errors.WORKER_NOT_VALIDATED)

    def test_job_application_failing_due_to_unavailable_job(self):
        """When a job application includes a job that is not in the right status:
        - an appropriate error should be returned
        - the entities should not be linked.
        """
        _, worker_address, username = random_userinfo()
        job_id = str(uuid.uuid4())

        with Session() as session:
            session.add(
                Worker(
                    id=worker_address,
                    is_validated=True,
                    username=username,
                    password="password1234",
                )
            )
            session.add(
                JobRequest(
                    id=job_id,
                    escrow_address=self.escrow_address,
                    chain_id=self.chain_id,
                )
            )
            session.commit()

        response = self.client.post(
            Endpoints.JOB_APPLY,
            json={"worker_id": worker_address, "job_id": job_id},
            headers=self.human_signature,
        )
        assert_http_error_response(response, Errors.JOB_UNAVAILABLE)

    def test_job_application_failing_due_to_worker_assignment_error(self):
        """When a job application fails during the worker assignment stage:
        - an appropriate error should be returned
        - the entities should not be linked.
        """
        _, worker_address, username = random_userinfo()
        job_id = str(uuid.uuid4())
        anno_project_id = job_id + "__1"
        with Session() as session:
            session.add(
                Worker(
                    id=worker_address,
                    is_validated=True,
                    username="DOES_NOT_EXIST",
                    password="password1234",
                )
            )
            jr = JobRequest(
                id=job_id,
                escrow_address=self.escrow_address,
                chain_id=self.chain_id,
                status=Statuses.in_progress,
            )
            session.add(jr)
            session.add(AnnotationProject(id=1, name=anno_project_id, job_request=jr))
            session.commit()

        response = self.client.post(
            Endpoints.JOB_APPLY,
            json={"worker_id": worker_address, "job_id": job_id},
            headers=self.human_signature,
        )

        assert_http_error_response(response, Errors.WORKER_ASSIGNMENT_FAILED)

    @patch(get_escrow_path)
    def test_endpoints_failing_due_to_invalid_signature(
        self, mock_get_escrow: MagicMock
    ):
        """When any endpoint that requires a signature from the calling service receives an invalid signature:
        - an appropriate error response should be returned
        """
        # human app endpoints
        user_info, worker_address, username = random_userinfo()
        job_id = str(uuid.uuid4())
        job_application = {"worker_id": worker_address, "job_id": job_id}
        header = {"Signature": "nonsense"}

        response = self.client.get(
            Endpoints.JOB_LIST + f"?chainId={self.chain_id}", headers=header
        )
        assert_http_error_response(response, Errors.SIGNATURE_INVALID)

        response = self.client.get(
            Endpoints.JOB_DETAIL + f"?jobId={job_id}", headers=header
        )
        assert_http_error_response(response, Errors.SIGNATURE_INVALID)

        response = self.client.post(
            Endpoints.USER_REGISTER, json=user_info, headers=header
        )
        assert_http_error_response(response, Errors.SIGNATURE_INVALID)

        response = self.client.post(
            Endpoints.JOB_APPLY, json=job_application, headers=header
        )
        assert_http_error_response(response, Errors.SIGNATURE_INVALID)

        # job launcher endpoint
        mock_get_escrow.return_value = self.mock_escrow
        header = {
            "Signature": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        }
        response = self.client.post(
            Endpoints.JOB_REQUEST, json=self.message, headers=header
        )
        assert_http_error_response(response, Errors.SIGNATURE_INVALID)


if __name__ == "__main__":
    unittest.main()
