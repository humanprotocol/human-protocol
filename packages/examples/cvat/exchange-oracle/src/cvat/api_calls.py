import io
import json
import logging
import zipfile
from collections.abc import Generator
from contextlib import contextmanager
from contextvars import ContextVar
from datetime import datetime, timedelta, timezone
from enum import Enum
from http import HTTPStatus
from io import BytesIO
from pathlib import Path
from time import sleep
from typing import Any

from cvat_sdk import Client, make_client
from cvat_sdk.api_client import ApiClient, Configuration, exceptions, models
from cvat_sdk.api_client.api_client import Endpoint
from cvat_sdk.core.helpers import get_paginated_collection
from cvat_sdk.core.uploading import AnnotationUploader

from src.core.config import Config
from src.utils.enums import BetterEnumMeta
from src.utils.time import utcnow

_NOTSET = object()


class CVATException(Exception):
    """Indicates that CVAT API returned unexpected response"""


def _request_annotations(endpoint: Endpoint, cvat_id: int, format_name: str) -> bool:
    """
    Requests annotations export.
    The dataset preparation can take some time (e.g. 10 min), so it must be used like this:

    while not _request_annotations(...):
        # some waiting like
        sleep(1)

    _get_annotations(...)
    """

    (_, response) = endpoint.call_with_http_info(
        id=cvat_id,
        format=format_name,
        _parse_response=False,
    )

    assert response.status in [HTTPStatus.ACCEPTED, HTTPStatus.CREATED]
    return response.status == HTTPStatus.CREATED


def _get_annotations(
    endpoint: Endpoint,
    *,
    cvat_id: int,
    format_name: str,
    attempt_interval: int = 5,
    timeout: int | None = _NOTSET,
) -> io.RawIOBase:
    """
    Downloads annotations.
    The dataset preparation can take some time (e.g. 10 min), so it should be used like this:

    while not _request_annotations(...):
        # some waiting like
        sleep(1)

    _get_annotations(...)


    It still can be used as 1 call, but the result can be unreliable.
    """

    time_begin = utcnow()

    if timeout is _NOTSET:
        timeout = Config.cvat_config.export_timeout

    while True:
        (_, response) = endpoint.call_with_http_info(
            id=cvat_id,
            action="download",
            format=format_name,
            _parse_response=False,
        )
        if response.status == HTTPStatus.OK:
            break

        if timeout is not None and timedelta(seconds=timeout) < (utcnow() - time_begin):
            raise Exception("Failed to retrieve the dataset from CVAT within the timeout interval")

        sleep(attempt_interval)

    file_buffer = io.BytesIO(response.data)
    assert zipfile.is_zipfile(file_buffer)
    file_buffer.seek(0)
    return file_buffer


_api_client_context: ContextVar[ApiClient] = ContextVar("api_client", default=None)


@contextmanager
def api_client_context(api_client: ApiClient) -> Generator[ApiClient, None, None]:
    old = _api_client_context.set(api_client)
    try:
        yield api_client
    finally:
        _api_client_context.reset(old)


def get_api_client() -> ApiClient:
    current_api_client = _api_client_context.get()
    if current_api_client:
        return current_api_client

    configuration = Configuration(
        host=Config.cvat_config.host_url,
        username=Config.cvat_config.admin_login,
        password=Config.cvat_config.admin_pass,
    )

    api_client = ApiClient(configuration=configuration)
    api_client.set_default_header("X-organization", Config.cvat_config.org_slug)

    return api_client


def get_sdk_client() -> Client:
    client = make_client(
        host=Config.cvat_config.host_url,
        credentials=(Config.cvat_config.admin_login, Config.cvat_config.admin_pass),
    )
    client.organization_slug = Config.cvat_config.org_slug

    return client


def create_cloudstorage(
    provider: str,
    bucket_name: str,
    *,
    credentials: dict[str, Any] | None = None,
    bucket_host: str | None = None,
) -> models.CloudStorageRead:
    # credentials: access_key | secret_key | service_account_key
    # CVAT credentials: key | secret_key | key_file
    def _to_cvat_credentials(credentials: dict[str, Any]) -> dict:
        cvat_credentials = {}
        for cvat_field, field in {
            "key": "access_key",
            "secret_key": "secret_key",
            "key_file": "service_account_key",
        }.items():
            if value := credentials.get(field):
                if cvat_field == "key_file":
                    key_file = BytesIO(json.dumps(value).encode("utf-8"))
                    key_file.name = "key_file.json"
                    key_file.seek(0)
                    cvat_credentials[cvat_field] = key_file
                else:
                    cvat_credentials[cvat_field] = value
        return cvat_credentials

    request_kwargs = {}

    if credentials:
        request_kwargs.update(_to_cvat_credentials(credentials))
        credentials_type = (
            models.CredentialsTypeEnum("KEY_SECRET_KEY_PAIR")
            if provider == "AWS_S3_BUCKET"
            else models.CredentialsTypeEnum("KEY_FILE_PATH")
        )
    else:
        credentials_type = models.CredentialsTypeEnum("ANONYMOUS_ACCESS")

    if bucket_host:
        request_kwargs["specific_attributes"] = f"endpoint_url={bucket_host}"

    logger = logging.getLogger("app")

    with get_api_client() as api_client:
        cloud_storage_write_request = models.CloudStorageWriteRequest(
            provider_type=models.ProviderTypeEnum(provider),
            resource=bucket_name,
            display_name=bucket_name,
            credentials_type=credentials_type,
            description=bucket_name,
            **request_kwargs,
        )  # CloudStorageWriteRequest
        try:
            (data, response) = api_client.cloudstorages_api.create(
                cloud_storage_write_request,
                _content_type="multipart/form-data",
            )

            return data
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling CloudstoragesApi.create(): {e}\n")
            raise


def create_project(
    name: str, *, labels: list | None = None, user_guide: str = ""
) -> models.ProjectRead:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        kwargs = {}

        if labels is not None:
            kwargs["labels"] = labels

        try:
            (project, response) = api_client.projects_api.create(
                models.ProjectWriteRequest(name=name, **kwargs)
            )
            if user_guide:
                api_client.guides_api.create(
                    annotation_guide_write_request=models.AnnotationGuideWriteRequest(
                        project_id=project.id,
                        markdown=user_guide,
                    )
                )

            return project
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling ProjectsApi.create: {e}\n")
            raise


def request_project_annotations(cvat_id: int, format_name: str) -> bool:
    """
    Requests annotations export.
    The dataset preparation can take some time (e.g. 10 min), so it must be used like this:

    while not request_project_annotations(...):
        # some waiting like
        sleep(1)

    get_project_annotations(...)
    """

    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            return _request_annotations(
                api_client.projects_api.retrieve_annotations_endpoint,
                cvat_id=cvat_id,
                format_name=format_name,
            )
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling ProjectApi.retrieve_annotations: {e}\n")
            raise


def get_project_annotations(
    cvat_id: int, format_name: str, *, timeout: int | None = _NOTSET
) -> io.RawIOBase:
    """
    Downloads annotations.
    The dataset preparation can take some time (e.g. 10 min), so it should be used like this:

    while not request_project_annotations(...):
        # some waiting like
        sleep(1)

    get_project_annotations(...)


    It still can be used as 1 call, but the result can be unreliable.
    """

    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            return _get_annotations(
                api_client.projects_api.retrieve_annotations_endpoint,
                cvat_id=cvat_id,
                format_name=format_name,
                timeout=timeout,
            )
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling ProjectApi.retrieve_annotations: {e}\n")
            raise


def create_cvat_webhook(project_id: int) -> models.WebhookRead:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        webhook_write_request = models.WebhookWriteRequest(
            target_url=Config.cvat_config.incoming_webhooks_url,
            description="Exchange Oracle notification",
            type=models.WebhookType("project"),
            content_type=models.WebhookContentType("application/json"),
            secret=Config.cvat_config.webhook_secret,
            is_active=True,
            # enable_ssl=True,
            project_id=project_id,
            events=[
                models.EventsEnum("update:job"),
                models.EventsEnum("create:job"),
            ],
        )  # WebhookWriteRequest
        try:
            (data, response) = api_client.webhooks_api.create(
                webhook_write_request,
            )
            return data
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling WebhooksApi.create(): {e}\n")
            raise


def create_task(
    project_id: int,
    name: str,
    *,
    segment_size: int,
) -> models.TaskRead:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        task_write_request = models.TaskWriteRequest(
            name=name,
            project_id=project_id,
            overlap=0,
            segment_size=segment_size,
        )
        try:
            (task_info, _) = api_client.tasks_api.create(task_write_request)
            return task_info

        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling tasks_api.create: {e}\n")
            raise


def create_audino_task(project_id: int, name: str, *, segment_duration: int) -> models.TaskRead:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        task_write_request = models.TaskWriteRequest(
            name=name,
            project_id=project_id,
            overlap=0,
            segment_duration=segment_duration,
            flags={
                "is_commonvoice": True,
            },
        )
        try:
            (task_info, _) = api_client.tasks_api.create(task_write_request)
            return task_info

        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling tasks_api.create: {e}\n")
            raise


def get_cloudstorage_contents(cloudstorage_id: int) -> list[str]:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            (
                content_data,
                response,
            ) = api_client.cloudstorages_api.retrieve_content(cloudstorage_id)
            return content_data
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling cloudstorages_api.retrieve_content: {e}\n")
            raise


def put_task_data(
    task_id: int,
    cloudstorage_id: int,
    *,
    chunk_size: int,
    filenames: list[str] | None = None,
    sort_images: bool | None = None,
    validation_params: dict[str, str | float | list[str]] | None = None,
    use_cache: bool = True,
    use_zip_chunks: bool = True,
) -> None:
    logger = logging.getLogger("app")

    with get_api_client() as api_client:
        kwargs = {}
        if filenames:
            kwargs["server_files"] = filenames
        else:
            kwargs["filename_pattern"] = "*"

        sorting_method = None

        if validation_params:
            if sort_images:
                raise AssertionError(
                    f"sort_images={sort_images} cannot be used. "
                    'Only random sorting can be used when task validation mode is "gt_pool"'
                )
            sorting_method = models.SortingMethod("random")

            gt_filenames = validation_params["gt_filenames"]
            if missed_filenames := set(gt_filenames) - set(filenames):
                filenames.extend(missed_filenames)

            kwargs["validation_params"] = models.DataRequestValidationParams(
                mode=models.ValidationMode("gt_pool"),
                frames=gt_filenames,
                frame_selection_method=models.FrameSelectionMethod("manual"),
                frames_per_job_count=validation_params["gt_frames_per_job_count"],
            )

        if sorting_method is None:
            if sort_images is None:
                sort_images = True

            sorting_method = (
                models.SortingMethod("lexicographical")
                if sort_images
                else models.SortingMethod("predefined")
            )

        data_request = models.DataRequest(
            chunk_size=chunk_size,
            cloud_storage_id=cloudstorage_id,
            image_quality=Config.cvat_config.image_quality,
            use_cache=use_cache,
            use_zip_chunks=use_zip_chunks,
            sorting_method=sorting_method,
            **kwargs,
        )
        try:
            (_, response) = api_client.tasks_api.create_data(task_id, data_request=data_request)
            return

        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling tasks_api.create_data: {e}\n")
            raise


def request_task_annotations(cvat_id: int, format_name: str) -> bool:
    """
    Requests annotations export.
    The dataset preparation can take some time (e.g. 10 min), so it must be used like this:

    while not request_task_annotations(...):
        # some waiting like
        sleep(1)

    get_task_annotations(...)
    """

    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            return _request_annotations(
                api_client.tasks_api.retrieve_annotations_endpoint,
                cvat_id=cvat_id,
                format_name=format_name,
            )
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling TasksApi.retrieve_annotations: {e}\n")
            raise


def get_task_annotations(
    cvat_id: int, format_name: str, *, timeout: int | None = _NOTSET
) -> io.RawIOBase:
    """
    Downloads annotations.
    The dataset preparation can take some time (e.g. 10 min), so it must be used like this:

    while not request_task_annotations(...):
        # some waiting like
        sleep(1)

    get_task_annotations(...)


    It still can be used as 1 call, but the result can be unreliable.
    """

    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            return _get_annotations(
                api_client.tasks_api.retrieve_annotations_endpoint,
                cvat_id=cvat_id,
                format_name=format_name,
                timeout=timeout,
            )
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling TasksApi.retrieve_annotations: {e}\n")
            raise


def fetch_task_jobs(task_id: int) -> list[models.JobRead]:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            return get_paginated_collection(
                api_client.jobs_api.list_endpoint,
                task_id=task_id,
                type="annotation",
            )
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling JobsApi.list: {e}\n")
            raise


def request_job_annotations(cvat_id: int, format_name: str) -> bool:
    """
    Requests annotations export.
    The dataset preparation can take some time (e.g. 10 min), so it must be used like this:

    while not request_job_annotations(...):
        # some waiting like
        sleep(1)

    get_job_annotations(...)
    """

    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            return _request_annotations(
                api_client.jobs_api.retrieve_annotations_endpoint,
                cvat_id=cvat_id,
                format_name=format_name,
            )
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling JobsApi.retrieve_annotations: {e}\n")
            raise


def get_job_annotations(
    cvat_id: int, format_name: str, *, timeout: int | None = _NOTSET
) -> io.RawIOBase:
    """
    Downloads annotations.
    The dataset preparation can take some time (e.g. 10 min), so it must be used like this:

    while not request_job_annotations(...):
        # some waiting like
        sleep(1)

    get_job_annotations(...)


    It still can be used as 1 call, but the result can be unreliable.
    """

    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            return _get_annotations(
                api_client.jobs_api.retrieve_annotations_endpoint,
                cvat_id=cvat_id,
                format_name=format_name,
                timeout=timeout,
            )
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling JobsApi.retrieve_annotations: {e}\n")
            raise


def delete_project(cvat_id: int) -> None:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            api_client.projects_api.destroy(cvat_id)
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling ProjectsApi.destroy(): {e}\n")
            raise


def delete_cloudstorage(cvat_id: int) -> None:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            api_client.cloudstorages_api.destroy(cvat_id)
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling CloudstoragesApi.destroy(): {e}\n")
            raise


def fetch_projects(assignee: str = "") -> list[models.ProjectRead]:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            return get_paginated_collection(
                api_client.projects_api.list_endpoint,
                **({"assignee": assignee} if assignee else {}),
            )
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling ProjectsApi.list(): {e}\n")
            raise


class UploadStatus(str, Enum, metaclass=BetterEnumMeta):
    QUEUED = "Queued"
    STARTED = "Started"
    FINISHED = "Finished"
    FAILED = "Failed"


def get_task_upload_status(cvat_id: int) -> tuple[UploadStatus | None, str]:
    logger = logging.getLogger("app")

    with get_api_client() as api_client:
        try:
            (status, _) = api_client.tasks_api.retrieve_status(cvat_id)
            return UploadStatus(status.state.value), status.message
        except exceptions.ApiException as e:
            if e.status == 404:
                return None, e.body

            logger.exception(f"Exception when calling ProjectsApi.list(): {e}\n")
            raise


def clear_job_annotations(job_id: int) -> None:
    logger = logging.getLogger("app")

    with get_api_client() as api_client:
        try:
            api_client.jobs_api.update_annotations(
                id=job_id,
                job_annotations_update_request=models.JobAnnotationsUpdateRequest(
                    tags=[], shapes=[], tracks=[]
                ),
            )
        except exceptions.ApiException as e:
            if e.status == 404:
                return

            logger.exception(f"Exception when calling JobsApi.partial_update_annotations(): {e}\n")
            raise


def get_gt_job(task_id: int) -> models.JobRead:
    logger = logging.getLogger("app")

    with get_api_client() as api_client:
        try:
            (paginated_jobs, _) = api_client.jobs_api.list(task_id=task_id, type="ground_truth")
            if (gt_jobs_count := len(paginated_jobs["results"])) != 1:
                raise CVATException(
                    f"CVAT returned {gt_jobs_count} GT jobs for the task({task_id})"
                )

            return paginated_jobs["results"][0]
        except (exceptions.ApiException, AssertionError) as ex:
            logger.exception(f"Exception when calling JobsApi.list(): {ex}\n")
            raise


def upload_gt_annotations(
    job_id: int,
    dataset_path: Path,
    *,
    format_name: str,
    sleep_interval: int = 5,
    timeout: int | None = Config.cvat_config.import_timeout,
) -> None:
    # FUTURE-TODO: use job.import_annotations when CVAT supports a waiting timeout
    start_time = datetime.now(timezone.utc)
    logger = logging.getLogger("app")

    with get_sdk_client() as client:
        uploader = AnnotationUploader(client)
        url = client.api_map.make_endpoint_url(
            client.api_client.jobs_api.create_annotations_endpoint.path, kwsub={"id": job_id}
        )

        try:
            response = uploader.upload_file(
                url,
                dataset_path,
                query_params={"format": format_name, "filename": dataset_path.name},
                meta={"filename": dataset_path.name},
            )
        except Exception as ex:
            logger.exception(f"Exception occurred while importing GT annotations: {ex}\n")
            raise

        request_id = json.loads(response.data).get("rq_id")
        if not request_id:
            raise CVATException(
                "CVAT server has not returned rq_id in the response when "
                f"uploading GT annotations to the {job_id} job"
            )

        while True:
            try:
                (request_details, _) = client.api_client.requests_api.retrieve(request_id)
            except exceptions.ApiException as ex:
                logger.exception(f"Exception occurred while importing GT annotations: {ex}\n")
                raise

            if (
                request_details.status.value
                == models.RequestStatus.allowed_values[("value",)]["FINISHED"]
            ):
                break

            if (
                request_details.status.value
                == models.RequestStatus.allowed_values[("value",)]["FAILED"]
            ):
                raise Exception(
                    "Annotations upload failed. "
                    f"Previous status was: {request_details.status.value}."
                )

            if timeout is not None and timedelta(seconds=timeout) < (utcnow() - start_time):
                raise Exception(
                    "Failed to upload the GT annotations to CVAT within the timeout interval. "
                    f"Previous status was: {request_details.status.value}. "
                    f"Timeout: {timeout} seconds."
                )

            sleep(sleep_interval)

    logger.info(f"GT annotations for the job {job_id} have been uploaded to CVAT.")


def get_quality_control_settings(task_id: int) -> models.QualitySettings:
    logger = logging.getLogger("app")

    with get_api_client() as api_client:
        try:
            paginated_data, _ = api_client.quality_api.list_settings(task_id=task_id)
            if (settings_count := len(paginated_data["results"])) != 1:
                raise CVATException(
                    f"CVAT returned {settings_count}"
                    f"quality control settings associated with the task({task_id})"
                )
            return paginated_data["results"][0]

        except exceptions.ApiException as ex:
            logger.exception(f"Exception when calling QualityApi.list_settings(): {ex}\n")
            raise


def update_quality_control_settings(
    settings_id: int,
    *,
    target_metric_threshold: float,
    target_metric: str = "accuracy",
    max_validations_per_job: int = Config.cvat_config.max_validation_checks,
    iou_threshold: float = Config.cvat_config.iou_threshold,
    oks_sigma: float | None = None,
    point_size_base: str | None = None,
    empty_is_annotated: bool | None = None,
) -> None:
    logger = logging.getLogger("app")

    params = {
        "max_validations_per_job": max_validations_per_job,
        "target_metric": target_metric,
        "target_metric_threshold": target_metric_threshold,
        "iou_threshold": iou_threshold,
        "low_overlap_threshold": iou_threshold,  # used only for warnings
    }

    if oks_sigma is not None:
        params["oks_sigma"] = oks_sigma

    if point_size_base is not None:
        params["point_size_base"] = point_size_base

    if empty_is_annotated is not None:
        params["empty_is_annotated"] = empty_is_annotated

    with get_api_client() as api_client:
        try:
            api_client.quality_api.partial_update_settings(
                settings_id,
                patched_quality_settings_request=models.PatchedQualitySettingsRequest(**params),
            )
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling QualityApi.partial_update_settings(): {e}\n")
            raise


def _update_job(
    job_id: int,
    *,
    assignee_id: int | None | object = _NOTSET,
    stage: models.JobStage | None = None,
    state: models.OperationStatus | None = None,
) -> None:
    to_update = {
        attr: value
        for attr, value in {
            "stage": stage,
            "state": state,
        }.items()
        if value
    }

    if assignee_id is not _NOTSET:
        to_update["assignee"] = assignee_id

    assert to_update

    logger = logging.getLogger("app")

    with get_api_client() as api_client:
        try:
            api_client.jobs_api.partial_update(
                job_id, patched_job_write_request=models.PatchedJobWriteRequest(**to_update)
            )
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling JobsApi.partial_update(): {e}\n")
            raise


def update_job_assignee(id: int, assignee_id: int | None):
    _update_job(id, assignee_id=assignee_id)


def restart_job(id: str, *, assignee_id: int | None = None):
    _update_job(
        id,
        stage=models.JobStage("annotation"),
        state=models.OperationStatus("new"),
        assignee_id=assignee_id,
    )


def finish_gt_job(job_id: int) -> None:
    _update_job(
        job_id, stage=models.JobStage("acceptance"), state=models.OperationStatus("completed")
    )


def get_user_id(user_email: str) -> int:
    logger = logging.getLogger("app")

    with get_api_client() as api_client:
        try:
            (invitation, _) = api_client.invitations_api.create(
                models.InvitationWriteRequest(role="worker", email=user_email),
                org=Config.cvat_config.org_slug,
            )
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling get_user_id(): {e}\n")
            raise

        return invitation.user.id


def remove_user_from_org(user_id: int):
    logger = logging.getLogger("app")

    with get_api_client() as api_client:
        try:
            (page, _) = api_client.users_api.list(
                filter='{"==":[{"var":"id"},"%s"]}' % user_id,  # noqa: UP031
                org=Config.cvat_config.org_slug,
            )
            if not page.results:
                return

            user = page.results[0]
            assert user.id == user_id

            (page, _) = api_client.memberships_api.list(
                user=user.username,
                org=Config.cvat_config.org_slug,
            )
            if page.results:
                api_client.memberships_api.destroy(page.results[0].id)
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling remove_user_from_org: {e}\n")
            raise
