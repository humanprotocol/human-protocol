import json
import logging
from datetime import timedelta
from http import HTTPStatus
from time import sleep
from typing import Any

from cvat_sdk.api_client import ApiClient, Configuration, exceptions, models
from cvat_sdk.core.helpers import get_paginated_collection

from src.core.config import Config
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
    max_waiting_time: int = 10 * 60,
    sleep_interval: float = 0.5,
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

        while utcnow() - start_time < timedelta(seconds=max_waiting_time):
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
                    sleep(sleep_interval)
                    continue
                case _:
                    raise Exception(f"Unexpected response status: {response.status}")

        raise Exception(f"Task({task_id}) quality report has not been created in time")


def get_task_quality_report(
    task_id: int,
    *,
    max_waiting_time: int = 10 * 60,
    sleep_interval: float = 0.5,
) -> models.QualityReport:
    logger = logging.getLogger("app")
    report = get_last_task_quality_report(task_id)
    if report and report.created_date > report.target_last_updated:
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(f"The latest task({task_id}) quality report({report.id}) is actual")
        return report

    return compute_task_quality_report(
        task_id, max_waiting_time=max_waiting_time, sleep_interval=sleep_interval
    )


def get_quality_report_data(report_id: int) -> dict[str, Any]:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            _, response = api_client.quality_api.retrieve_report_data(
                report_id, _parse_response=False
            )
            report_data = json.loads(response.data)
            assert report_data
            return report_data

        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling QualityApi.retrieve_report_data: {e}\n")
            raise


def get_job_validation_layout(job_id: int) -> models.JobValidationLayoutRead:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            layout, _ = api_client.jobs_api.retrieve_validation_layout(job_id)
            return layout

        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling JobApi.retrieve_validation_layout: {e}\n")
            raise


def get_task_validation_layout(task_id: int) -> models.TaskValidationLayoutRead:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            layout, _ = api_client.tasks_api.retrieve_validation_layout(task_id)
            return layout

        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling TaskApi.retrieve_validation_layout: {e}\n")
            raise


def get_jobs_quality_reports(parent_id: int) -> dict[int, models.QualityReport]:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        try:
            reports: list[models.QualityReport] = get_paginated_collection(
                api_client.quality_api.list_reports_endpoint, parent_id=parent_id, target="job"
            )
            return {report.job_id: report for report in reports}

        except exceptions.ApiException as e:
            logger.exception(f"Exception when calling QualityApi.list_reports: {e}\n")
            raise


def get_quality_report_data(report_id: int) -> dict[str, Any]:
    with get_api_client() as api_client:
        _, response = api_client.quality_api.retrieve_report_data(report_id, _parse_response=False)
        assert response.status == HTTPStatus.OK
        return response.json()


def shuffle_honeypots_in_jobs(job_ids: list[int] | int) -> None:
    logger = logging.getLogger("app")

    if isinstance(job_ids, int):
        job_ids = [job_ids]

    with get_api_client() as api_client:
        for job_id in job_ids:
            updated_validation_layout, _ = api_client.jobs_api.partial_update_validation_layout(
                job_id,
                patched_job_validation_layout_write_request=models.PatchedJobValidationLayoutWriteRequest(
                    frame_selection_method="random_uniform",
                ),
            )
            if logger.isEnabledFor(logging.DEBUG):
                logger.debug(
                    f"Updated validation layout for the job {job_id}: {updated_validation_layout!s}"
                )


def disable_validation_frames(task_id: int, *, frames_to_disable: list[int]) -> None:
    logger = logging.getLogger("app")
    with get_api_client() as api_client:
        task_validation_layout, _ = api_client.tasks_api.retrieve_validation_layout(task_id)
        disabled_frames = task_validation_layout.disabled_frames

        # nothing to update
        if not (set(frames_to_disable) - set(disabled_frames)):
            if logger.isEnabledFor(logging.DEBUG):
                logger.debug(
                    f"Validation frames {frames_to_disable!r} are already "
                    f"disabled for the CVAT task {task_id}"
                )
            return

        api_client.tasks_api.partial_update_validation_layout(
            task_id,
            patched_task_validation_layout_write_request=models.PatchedTaskValidationLayoutWriteRequest(
                disabled_frames=sorted(set(disabled_frames + frames_to_disable))
            ),
        )
        logger.info(
            f"Validation frames {frames_to_disable!r} have been disabled "
            f"for the CVAT task {task_id}"
        )
