import shutil
import unittest
from pathlib import Path
from test.utils import (
    add_job_request,
    add_projects_to_job_request,
    random_address,
    upload_manifest_and_task_data,
)
from unittest.mock import MagicMock, patch

from src.config import Config
from src.cron_jobs import (
    notify_recording_oracle,
    process_completed_job_requests,
    process_in_progress_job_requests,
    process_pending_job_requests,
    upload_completed_job_requests,
)
from src.db import (
    AnnotationProject,
    Base,
    JobRequest,
    Session,
    Statuses,
    Worker,
    engine,
)


class CRONJobTest(unittest.TestCase):
    def setUp(self):
        Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)

    def tearDown(self):
        Base.metadata.drop_all(engine)

    @patch("src.cron_jobs.get_manifest_url")
    def test_process_pending_job_request(self, mock_get_manifest_url: MagicMock):
        """When a pending job is processed:
        - a number of projects should be set up for the job
        - the projects should be assigned to the job
        - if everything is successful, the job's status should be set to in progress.
        """
        job_id = add_job_request()

        manifest_s3_url = upload_manifest_and_task_data()
        mock_get_manifest_url.return_value = manifest_s3_url
        process_pending_job_requests()
        mock_get_manifest_url.assert_called_once()

        with Session() as session:
            job = session.query(JobRequest).where(JobRequest.id == job_id).one()
            assert job.status == Statuses.in_progress
            assert len(job.projects) > 0

    @patch("src.cron_jobs.set_up_projects_for_job")
    def test_process_pending_job_request_failing_due_to_error_in_setting_up_project(
        self, mock_set_up_projects
    ):
        """When the project setup for a job is failing:
        - its status should be set to failed
        """
        mock_set_up_projects.side_effect = RuntimeError("Something went wrong!")
        job_id = add_job_request()

        process_pending_job_requests()

        with Session() as session:
            job = session.query(JobRequest).where(JobRequest.id == job_id).one()
            assert job.status == Statuses.failed
            assert len(job.projects) == 0

    @patch("src.cron_jobs.is_done")
    def test_process_in_progress_job_requests(self, mock_is_done: MagicMock):
        """When a job that is currently in progress is processed:
        - all of its constituent projects should be checked for completion and their status set to completed if so
        - if all projects for a job are completed, the job status should be set to completed
        """
        job_id = add_job_request(Statuses.in_progress)
        add_projects_to_job_request(job_id, 3, Statuses.in_progress)
        mock_is_done.return_value = True

        process_in_progress_job_requests()

        with Session() as session:
            job = session.query(JobRequest).where(JobRequest.id == job_id).one()
            projects = (
                session.query(AnnotationProject)
                .where(AnnotationProject.job_request_id == job_id)
                .all()
            )

            assert job.status == Statuses.completed
            assert all(project.status == Statuses.completed for project in projects)

    @patch("src.cron_jobs.is_done")
    def test_process_in_progress_job_requests_with_partially_completed_project_set(
        self, mock_is_done: MagicMock
    ):
        """When not all constituent projects of a job in progress are completed:
        - all projects that are complete should have their status updated to completed
        - the job should remain in progress
        """
        n_projects = 3
        job_id = add_job_request(Statuses.in_progress)
        add_projects_to_job_request(job_id, n_projects, Statuses.in_progress)

        is_done_status = [True for _ in range(n_projects - 1)]
        is_done_status.append(False)
        mock_is_done.side_effect = is_done_status

        process_in_progress_job_requests()

        with Session() as session:
            job = session.query(JobRequest).where(JobRequest.id == job_id).one()
            projects = (
                session.query(AnnotationProject)
                .where(AnnotationProject.job_request_id == job_id)
                .all()
            )

            assert job.status == Statuses.in_progress
            assert not all(project.status == Statuses.completed for project in projects)

    def test_upload_completed_job_requests(self):
        """When a job is awaiting upload:
        - all its annotations should be converted into the raw results format
        - the raw results should be uploaded to the appropriate s3 bucket
        - local data should be deleted
        - the job status should be set to awaiting closure
        """
        job_id = add_job_request(Statuses.awaiting_upload)

        # add workers with usernames in the test data
        usernames = ["test", "admin", "bar"]
        with Session() as session:
            for username in usernames:
                session.add(
                    Worker(
                        id=random_address(), username=username, password="12345password"
                    )
                )
            session.commit()

        # prepare data as if it was previously downloaded
        file_path = Path(__file__).parent.parent / "data/test_annotations.zip"
        data_dir = Config.storage_config.dataset_dir / job_id
        data_dir.mkdir(exist_ok=True, parents=True)
        shutil.copy(file_path.resolve(), data_dir)

        upload_completed_job_requests()

        # check s3 bucket has file
        client = Config.storage_config.client()
        args = [Config.storage_config.results_bucket_name, f"{job_id}.jsonl"]
        client.stat_object(*args)
        client.remove_object(*args)  # clean up

        # check local data was deleted
        assert not data_dir.exists()

        # check status was updated
        with Session() as session:
            job = session.query(JobRequest).where(JobRequest.id == job_id).one()
            assert job.status == Statuses.awaiting_closure

    @patch("src.cron_jobs.convert_annotations_to_raw_results")
    def test_upload_completed_job_requests_failing(self, mock_convert):
        """When a job is awaiting upload and the upload fails:
        - its status should be set to failed
        """
        job_id = add_job_request(Statuses.awaiting_upload)
        mock_convert.side_effect = RuntimeError("Something went wrong")

        upload_completed_job_requests()

        with Session() as session:
            job = session.query(JobRequest).where(JobRequest.id == job_id).one()
            assert job.status == Statuses.failed

    @patch("src.cron_jobs.delete_project")
    @patch("src.cron_jobs.download_annotations")
    def test_process_completed_job_requests(
        self, mock_download: MagicMock, mock_delete: MagicMock
    ):
        """When a job is complete:
        - all its constituent annotation projects
        - should be downloaded and deleted
        - the job's status should be set to awaiting upload.
        """
        job_id = add_job_request(Statuses.completed)
        add_projects_to_job_request(job_id, 3, Statuses.completed)

        process_completed_job_requests()

        with Session() as session:
            job = session.query(JobRequest).where(JobRequest.id == job_id).one()
            projects = (
                session.query(AnnotationProject)
                .where(AnnotationProject.job_request_id == job_id)
                .all()
            )

            mock_download.assert_any_call(
                project_id=projects[0].id, job_request_id=projects[0].job_request_id
            )
            mock_delete.assert_any_call(projects[0].id)

            assert all(project.status == Statuses.closed for project in projects)
            assert job.status == Statuses.awaiting_upload

    @patch("src.cron_jobs.delete_project")
    @patch("src.cron_jobs.download_annotations")
    def test_process_completed_job_requests_failing_partially_due_to_failing_project_processing(
        self, mock_download: MagicMock, mock_delete: MagicMock
    ):
        """When a completed job is being processed and any one of its constituent projects cannot be processed:
        - the project should be marked as failed
        - the job should still be marked as awaiting upload
        """
        n_projects = 3
        job_id = add_job_request(Statuses.completed)
        add_projects_to_job_request(job_id, n_projects, Statuses.completed)

        # set up one project to fail downloading
        side_effects = [None for _ in range(n_projects)]
        side_effects[-1] = RuntimeError
        mock_download.side_effect = side_effects

        process_completed_job_requests()

        with Session() as session:
            job = session.query(JobRequest).where(JobRequest.id == job_id).one()
            projects = (
                session.query(AnnotationProject)
                .where(AnnotationProject.job_request_id == job_id)
                .all()
            )

            mock_download.assert_any_call(
                project_id=projects[-1].id, job_request_id=projects[-1].job_request_id
            )

            assert all(project.status == Statuses.closed for project in projects[:-1])
            assert projects[-1].status == Statuses.failed
            assert job.status == Statuses.awaiting_upload

    @patch("src.cron_jobs.Config.http.request")
    def test_notify_recording_oracle(self, mock_request: MagicMock):
        """When a job is awaiting closure:
        - the recording oracle should receive the processed data via a request to the appropriate endpoint
        - if the request is successful the job should be set to closed
        """
        mock_response = MagicMock()
        mock_response.status = 200
        mock_request.return_value = mock_response

        job_id = add_job_request(Statuses.awaiting_closure)
        notify_recording_oracle()

        with Session() as session:
            job = session.query(JobRequest).where(JobRequest.id == job_id).one()
            assert job.status == Statuses.closed

    def test_notify_recording_oracle_failing_due_to_unreachable_recording_oracle(self):
        """When a job is awaiting closure and the recording oracle cannot be notified:
        - the job should be set to failed
        """
        job_id = add_job_request(Statuses.awaiting_closure)
        notify_recording_oracle()

        with Session() as session:
            job = session.query(JobRequest).where(JobRequest.id == job_id).one()
            assert job.status == Statuses.failed


if __name__ == "__main__":
    unittest.main()
