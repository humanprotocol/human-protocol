import io
import zipfile
import xmltodict
import logging
from http import HTTPStatus
from typing import Dict, List

from src.config import Config
from cvat_sdk.api_client import Configuration, ApiClient, models, exceptions

configuration = Configuration(
    host=Config.cvat_config.cvat_url,
    username=Config.cvat_config.cvat_admin,
    password=Config.cvat_config.cvat_admin_pass,
)


def create_cloudstorage(provider: str, bucket_name: str) -> int:
    logger = logging.getLogger("app")
    with ApiClient(configuration) as api_client:
        cloud_storage_write_request = models.CloudStorageWriteRequest(
            provider_type=models.ProviderTypeEnum(provider),
            resource=bucket_name,
            display_name=bucket_name,
            credentials_type=models.CredentialsTypeEnum("ANONYMOUS_ACCESS"),
            description=bucket_name,
            manifests=["manifest.jsonl"],
        )  # CloudStorageWriteRequest
        try:
            (data, response) = api_client.cloudstorages_api.create(
                cloud_storage_write_request,
            )

            return data
        except exceptions.ApiException as e:
            logger.error(f"Exception when calling CloudstoragesApi.create(): {e}\n")


def create_project(escrow_address: str, labels: list) -> Dict:
    logger = logging.getLogger("app")
    with ApiClient(configuration) as api_client:
        project_write_request = models.ProjectWriteRequest(
            name=escrow_address,
            labels=labels,
            owner_id=Config.cvat_config.cvat_admin_user_id,
        )
        try:
            (data, response) = api_client.projects_api.create(project_write_request)
            return data
        except exceptions.ApiException as e:
            logger.error(f"Exception when calling ProjectsApi.create: {e}\n")


def setup_cvat_webhooks(project_id: int) -> Dict:
    logger = logging.getLogger("app")
    with ApiClient(configuration) as api_client:
        webhook_write_request = models.WebhookWriteRequest(
            target_url=Config.cvat_config.cvat_incoming_webhooks_url,
            description="Update",
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
            logger.error(f"Exception when calling WebhooksApi.create(): {e}\n")


def create_task(project_id: int, escrow_address: str) -> Dict:
    logger = logging.getLogger("app")
    with ApiClient(configuration) as api_client:
        task_write_request = models.TaskWriteRequest(
            name=escrow_address,
            project_id=project_id,
            owner_id=Config.cvat_config.cvat_admin_user_id,
            overlap=Config.cvat_config.cvat_job_overlap,
            segment_size=Config.cvat_config.cvat_job_segment_size,
        )
        try:
            (task_info, response) = api_client.tasks_api.create(task_write_request)
            return task_info

        except exceptions.ApiException as e:
            logger.error(f"Exception when calling tasks_api.create: {e}\n")


def get_cloudstorage_content(cloudstorage_id: int) -> List:
    logger = logging.getLogger("app")
    with ApiClient(configuration) as api_client:
        try:
            (content_data, response) = api_client.cloudstorages_api.retrieve_content(
                cloudstorage_id
            )
            # (data, response) = api_client.cloudstorages_api.retrieve(cloudstorage_id) Not working in SDK
            return content_data + ["manifest.jsonl"]
        except exceptions.ApiException as e:
            logger.error(
                f"Exception when calling cloudstorages_api.retrieve_content: {e}\n"
            )


def put_task_data(task_id: int, cloudstorage_id: int) -> None:
    logger = logging.getLogger("app")
    with ApiClient(configuration) as api_client:
        content = get_cloudstorage_content(cloudstorage_id)
        data_request = models.DataRequest(
            chunk_size=Config.cvat_config.cvat_job_segment_size,
            cloud_storage_id=cloudstorage_id,
            image_quality=Config.cvat_config.cvat_default_image_quality,
            server_files=content,
            use_cache=True,
            use_zip_chunks=True,
            sorting_method="lexicographical",
        )
        try:
            (_, response) = api_client.tasks_api.create_data(task_id, data_request)
            return None

        except exceptions.ApiException as e:
            logger.error(f"Exception when calling ProjectsApi.put_task_data: {e}\n")


def fetch_task_jobs(task_id: int) -> List[Dict]:
    logger = logging.getLogger("app")
    with ApiClient(configuration) as api_client:
        try:
            (data, response) = api_client.jobs_api.list(task_id=task_id)
            return data
        except exceptions.ApiException as e:
            logger.error(f"Exception when calling JobsApi.list: {e}\n")


def get_job_annotations(cvat_project_id: int) -> Dict:
    logger = logging.getLogger("app")
    with ApiClient(configuration) as api_client:
        try:
            for _ in range(5):
                (_, response) = api_client.jobs_api.retrieve_annotations(
                    id=cvat_project_id,
                    action="download",
                    format="CVAT for images 1.1",
                    _parse_response=False,
                )
                if response.status == HTTPStatus.OK:
                    break
            buffer = io.BytesIO(response.data)
            with zipfile.ZipFile(buffer, "r") as zip_file:
                xml_content = zip_file.read("annotations.xml").decode("utf-8")
            annotations = xmltodict.parse(xml_content, attr_prefix="")
            return annotations["annotations"]
        except exceptions.ApiException as e:
            logger.error(f"Exception when calling JobsApi.retrieve_annotations: {e}\n")
