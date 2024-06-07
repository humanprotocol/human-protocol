import io
import json
import logging
import zipfile
from contextlib import contextmanager
from contextvars import ContextVar
from datetime import timedelta
from enum import Enum
from http import HTTPStatus
from io import BytesIO
from time import sleep
from typing import Any, Dict, Generator, List, Optional, Tuple

from cvat_sdk.api_client import ApiClient, Configuration, exceptions, models
from cvat_sdk.api_client.api_client import Endpoint
from cvat_sdk.core.helpers import get_paginated_collection

from src.core.config import Config
from src.utils.enums import BetterEnumMeta
from src.utils.time import utcnow

_NOTSET = object()


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
    timeout: Optional[int] = _NOTSET,
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
        timeout = Config.features.default_export_timeout

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
        host=Config.cvat_config.cvat_url,
        username=Config.cvat_config.cvat_admin,
        password=Config.cvat_config.cvat_admin_pass,
    )

    api_client = ApiClient(configuration=configuration)
    api_client.set_default_header("X-organization", Config.cvat_config.cvat_org_slug)

    return api_client


def create_cloudstorage(
    provider: str,
    bucket_name: str,
    *,
    credentials: Optional[Dict[str, Any]] = None,
    bucket_host: Optional[str] = None,
) -> models.CloudStorageRead:
    # credentials: access_key | secret_key | service_account_key
    # CVAT credentials: key | secret_key | key_file
    def _to_cvat_credentials(credentials: Dict[str, Any]) -> Dict:
        cvat_credentials = dict()
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

    request_kwargs = dict()

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
    name: str, *, labels: Optional[list] = None, user_guide: str = ""
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
    cvat_id: int, format_name: str, *, timeout: Optional[int] = _NOTSET
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
            target_url=Config.cvat_config.cvat_incoming_webhooks_url,
            description="Exchange Oracle notification",
            type=models.WebhookType("project"),
            content_type=models.WebhookContentType("application/json"),
            secret=Config.cvat_config.cvat_webhook_secret,
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


def create_task(project_id: int, name: str) -> models.TaskRead:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        task_write_request = models.TaskWriteRequest(
            name=name,
            project_id=project_id,
            overlap=0,
            segment_size=Config.cvat_config.cvat_job_segment_size,
        )
        try:
            (task_info, response) = api_client.tasks_api.create(task_write_request)
            return task_info

        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling tasks_api.create: {e}\n")
            raise


def get_cloudstorage_contents(cloudstorage_id: int) -> List[str]:
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
    filenames: Optional[list[str]] = None,
    sort_images: bool = True,
) -> None:
    logger = logging.getLogger("app")

    with get_api_client() as api_client:
        kwargs = {}
        if filenames:
            kwargs["server_files"] = filenames
        else:
            kwargs["filename_pattern"] = "*"

        data_request = models.DataRequest(
            chunk_size=Config.cvat_config.cvat_job_segment_size,
            cloud_storage_id=cloudstorage_id,
            image_quality=Config.cvat_config.cvat_default_image_quality,
            use_cache=True,
            use_zip_chunks=True,
            sorting_method="lexicographical" if sort_images else "predefined",
            **kwargs,
        )
        try:
            (_, response) = api_client.tasks_api.create_data(task_id, data_request=data_request)
            return None

        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling ProjectsApi.put_task_data: {e}\n")
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
    cvat_id: int, format_name: str, *, timeout: Optional[int] = _NOTSET
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


def fetch_task_jobs(task_id: int) -> List[models.JobRead]:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            data = get_paginated_collection(
                api_client.jobs_api.list_endpoint,
                task_id=task_id,
                type="annotation",
            )
            return data
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
    cvat_id: int, format_name: str, *, timeout: Optional[int] = _NOTSET
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


def fetch_projects(assignee: str = "") -> List[models.ProjectRead]:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            return get_paginated_collection(
                api_client.projects_api.list_endpoint,
                **(dict(assignee=assignee) if assignee else {}),
            )
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling ProjectsApi.list(): {e}\n")
            raise


class UploadStatus(str, Enum, metaclass=BetterEnumMeta):
    QUEUED = "Queued"
    STARTED = "Started"
    FINISHED = "Finished"
    FAILED = "Failed"


def get_task_upload_status(cvat_id: int) -> Tuple[Optional[UploadStatus], str]:
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
                return None

            logger.exception(f"Exception when calling JobsApi.partial_update_annotations(): {e}\n")
            raise


def update_job_assignee(id: str, assignee_id: Optional[int]):
    logger = logging.getLogger("app")

    with get_api_client() as api_client:
        try:
            api_client.jobs_api.partial_update(
                id=id,
                patched_job_write_request=models.PatchedJobWriteRequest(assignee=assignee_id),
            )
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling JobsApi.partial_update(): {e}\n")
            raise


def restart_job(id: str, *, assignee_id: Optional[int] = None):
    logger = logging.getLogger("app")

    with get_api_client() as api_client:
        try:
            api_client.jobs_api.partial_update(
                id=id,
                patched_job_write_request=models.PatchedJobWriteRequest(
                    stage="annotation", state="new", assignee=assignee_id
                ),
            )
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling JobsApi.partial_update(): {e}\n")
            raise


def get_user_id(user_email: str) -> int:
    logger = logging.getLogger("app")

    with get_api_client() as api_client:
        try:
            (invitation, _) = api_client.invitations_api.create(
                models.InvitationWriteRequest(role="worker", email=user_email),
                org=Config.cvat_config.cvat_org_slug,
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
                filter='{"==":[{"var":"id"},"%s"]}' % (user_id,),
                org=Config.cvat_config.cvat_org_slug,
            )
            if not page.results:
                return

            user = page.results[0]
            assert user.id == user_id

            (page, _) = api_client.memberships_api.list(
                user=user.username,
                org=Config.cvat_config.cvat_org_slug,
            )
            if page.results:
                api_client.memberships_api.destroy(page.results[0].id)
        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling remove_user_from_org: {e}\n")
            raise
