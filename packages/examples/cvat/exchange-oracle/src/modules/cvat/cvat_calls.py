import logging
from typing import Dict, List
import requests

from src.config import Config
from cvat_sdk.api_client import Configuration, ApiClient, models, exceptions

configuration = Configuration(
    host=Config.cvat_config.cvat_url,
    username=Config.cvat_config.cvat_admin,
    password=Config.cvat_config.cvat_admin_pass,
)


def job_creation_process(
    escrow_address: str, labels: list, bucket_name: str, region: str
):
    # Create a cloudstorage on CVAT for not storing datasets on CVAT instance
    cloudstorage = 35  # = create_cloudstorage(bucket_name, region)
    # Creating a project on CVAT. Necessary because otherwise webhooks aren't available
    project = create_project(escrow_address, labels)
    # Setup webhooks for a project (on job:update)
    setup_cvat_webhooks(project.id)
    # Task creation
    task = create_task(project.id, escrow_address)
    # Actual job creation on CVAT. Async process.
    put_task_data(task.id, cloudstorage)


# Not using cvat sdk because it fails to create cloudstorages because of the schema error
def create_cloudstorage(bucket_name: str, region: str) -> int:
    cloudstorage_payload = {
        "provider_type": "AWS_S3_BUCKET",
        "resource": bucket_name,
        "display_name": bucket_name,
        "credentials_type": "ANONYMOUS_ACCESS",
        "manifests": ["manifest.jsonl"],
        "specific_attributes": f"region={region}",
        "description": bucket_name,
    }

    create_new_cloustorage_response = requests.post(
        url=f"{Config.cvat_config.cvat_url}/api/cloudstorages",
        auth=(Config.cvat_config.cvat_admin, Config.cvat_config.cvat_admin_pass),
        json=cloudstorage_payload,
    )
    create_new_cloustorage_response.raise_for_status()

    cloudstorage_info = create_new_cloustorage_response.json()
    cvat_cloudstorage_id = cloudstorage_info["id"]

    return cvat_cloudstorage_id


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
            logger.error(f"Exception when calling projects_api.create: {e}")


# Not using cvat sdk because it throws error on creation because of the schema error
def setup_cvat_webhooks(project_id: int) -> Dict:
    logger = logging.getLogger("app")
    webhook_payload = {
        "target_url": Config.cvat_config.cvat_incoming_webhooks_url,
        "description": "job upd",
        "project_id": project_id,
        "type": "project",
        "content_type": "application/json",
        "events": ["update:job", "create:task"],
        "is_active": True,
        "secret": "test",
    }

    setup_webhook_response = requests.post(
        url=f"{Config.cvat_config.cvat_url}/api/webhooks",
        auth=(Config.cvat_config.cvat_admin, Config.cvat_config.cvat_admin_pass),
        json=webhook_payload,
    )

    setup_webhook_response.raise_for_status()
    setup_webhook = setup_webhook_response.json()

    return setup_webhook


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
            logger.error(f"Exception when calling tasks_api.create: {e}")


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
                f"Exception when calling cloudstorages_api.retrieve_content: {e}"
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
            logger.error(f"Exception when calling ProjectsApi.put_task_data: {e}")
