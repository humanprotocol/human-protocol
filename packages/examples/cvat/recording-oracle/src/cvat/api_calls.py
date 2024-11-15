import json
import logging
from datetime import timedelta
from http import HTTPStatus
from time import sleep

from cvat_sdk.api_client import ApiClient, Configuration, exceptions, models
from cvat_sdk.core.helpers import get_paginated_collection

from src.core.config import Config
from src.cvat.interface import QualityReportData
from src.utils.time import utcnow


def get_api_client() -> ApiClient:
    configuration = Configuration(
        host=Config.cvat_config.cvat_url,
        username=Config.cvat_config.cvat_admin,
        password=Config.cvat_config.cvat_admin_pass,
    )

    api_client = ApiClient(configuration=configuration)
    api_client.set_default_header("X-organization", Config.cvat_config.cvat_org_slug)

    return api_client


def get_last_task_quality_report(task_id: int) -> models.QualityReport | None:
    with get_api_client() as api_client:
        paginated_result, _ = api_client.quality_api.list_reports(
            task_id=task_id,
            page_size=1,
            target="task",
            sort="-created_date",
        )
        assert len(paginated_result.results) <= 1
        return paginated_result.results[0] if paginated_result.results else None


def compute_task_quality_report(
    task_id: int,
    *,
    timeout: int = Config.cvat_config.cvat_quality_retrieval_timeout,
    check_interval: float = Config.cvat_config.cvat_quality_check_interval,
) -> models.QualityReport:
    logger = logging.getLogger("app")
    start_time = utcnow()

    with get_api_client() as api_client:
        _, response = api_client.quality_api.create_report(
            quality_report_create_request={"task_id": task_id}, _parse_response=False
        )
        rq_id = json.loads(response.data).get("rq_id")
        assert rq_id, (
            "CVAT server hasn't returned rq_id in the response "
            f"when creating a task({task_id}) quality report"
        )

        while utcnow() - start_time < timedelta(seconds=timeout):
            _, response = api_client.quality_api.create_report(
                rq_id=rq_id, _check_status=False, _parse_response=False
            )
            match response.status:
                case HTTPStatus.CREATED:
                    report = models.QualityReport._from_openapi_data(**json.loads(response.data))
                    if logger.isEnabledFor(logging.DEBUG):
                        logger.debug(f"Created quality report: {report.id}")

                    return report
                case HTTPStatus.ACCEPTED:
                    sleep(check_interval)
                    continue
                case _:
                    raise Exception(f"Unexpected response status: {response.status}")

        raise Exception(f"Task({task_id}) quality report has not been created in time")


def get_task(task_id: int) -> models.TaskRead:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            task, _ = api_client.tasks_api.retrieve(task_id)
            return task

        except exceptions.ApiException as ex:
            logger.exception(f"Exception when calling TaskApi.retrieve: {ex}\n")
            raise


def get_task_quality_report(
    task_id: int,
    *,
    timeout: int = Config.cvat_config.cvat_quality_retrieval_timeout,
    check_interval: float = Config.cvat_config.cvat_quality_check_interval,
) -> models.QualityReport:
    logger = logging.getLogger("app")

    report = get_last_task_quality_report(task_id)

    if (
        report
        # retrieving the task details to check if the latest quality report is up-to-date
        # or not should be more effective than recreating the quality report each time
        and get_task(task_id).updated_date <= report.target_last_updated
    ):
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(
                f"The latest task({task_id}) quality report({report.id}) is actual. "
                "Do not re-create it."
            )
        return report

    return compute_task_quality_report(task_id, timeout=timeout, check_interval=check_interval)


def get_quality_report_data(report_id: int) -> QualityReportData:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            _, response = api_client.quality_api.retrieve_report_data(
                report_id, _parse_response=False
            )
            return QualityReportData(**response.json())

        except exceptions.ApiException as ex:
            logger.exception(f"Exception when calling QualityApi.retrieve_report_data: {ex}\n")
            raise


def get_jobs_quality_reports(parent_id: int) -> list[models.QualityReport]:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            return get_paginated_collection(
                api_client.quality_api.list_reports_endpoint, parent_id=parent_id, target="job"
            )

        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling QualityApi.list_reports: {e}\n")
            raise


def get_task_validation_layout(task_id: int) -> models.TaskValidationLayoutRead:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            layout, _ = api_client.tasks_api.retrieve_validation_layout(task_id)

            if logger.isEnabledFor(logging.DEBUG):
                logger.debug(f"Retrieved validation layout: {layout}")

            return layout

        except exceptions.ApiException as ex:
            logger.exception(f"Exception when calling TaskApi.retrieve_validation_layout: {ex}\n")
            raise


def update_task_validation_layout(
    task_id: int,
    *,
    disabled_frames: list[int],
    honeypot_real_frames: list[int] | None,
) -> None:
    logger = logging.getLogger("app")

    with get_api_client() as api_client:
        try:
            validation_layout, _ = api_client.tasks_api.partial_update_validation_layout(
                task_id,
                patched_task_validation_layout_write_request=models.PatchedTaskValidationLayoutWriteRequest(
                    disabled_frames=disabled_frames,
                    **(
                        {
                            "honeypot_real_frames": honeypot_real_frames,
                            "frame_selection_method": models.FrameSelectionMethod("manual"),
                        }
                        if honeypot_real_frames
                        else {}
                    ),
                ),
            )
        except exceptions.ApiException as ex:
            logger.exception(
                f"Exception when calling TasksApi.partial_update_validation_layout: {ex}\n"
            )
            raise

        logger.info(f"Validation layout for the task {task_id} has been updated.")

        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(f"Validation layout: {validation_layout}")


def get_task_data_meta(task_id: int) -> models.DataMetaRead:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            data_meta, _ = api_client.tasks_api.retrieve_data_meta(task_id)
            return data_meta

        except exceptions.ApiException as ex:
            logger.exception(f"Exception when calling TaskApi.retrieve_data_meta: {ex}\n")
            raise
