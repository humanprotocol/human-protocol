import json
import math
import uuid
from datetime import timedelta
from itertools import combinations
from unittest.mock import patch

from fastapi.responses import Response
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy.orm import Session

from src.core.config import Config
from src.core.types import AssignmentStatuses, ProjectStatuses, TaskTypes
from src.models.cvat import Assignment, Job, Project, Task, User
from src.schemas.exchange import AssignmentStatuses as APIAssignmentStatuses
from src.schemas.exchange import JobStatuses as APIJobStatuses
from src.utils.time import utcnow

from tests.utils.db_helper import (
    create_job,
    create_project,
    create_project_and_task,
    create_project_task_and_job,
    create_task,
)

escrow_address = "0x12E66A452f95bff49eD5a30b0d06Ebc37C5A94B6"
user_address = "0x86e83d346041E8806e352681f3F14549C0d2BC60"
cvat_email = "test@hmt.ai"


def generate_jwt_token(
    *,
    wallet_address: str | None = user_address,
    email: str = cvat_email,
) -> str:
    return jwt.encode(
        {
            **({"wallet_address": wallet_address} if wallet_address else {"role": "HUMAN_APP"}),
            "email": email,
        },
        Config.human_app_config.jwt_key,
    )


def get_auth_header(token: str = generate_jwt_token()) -> dict:
    return {"Authorization": f"Bearer {token}"}


empty_result = {
    "page": 0,
    "total_pages": 0,
    "total_results": 0,
    "results": [],
    "page_size": 5,  # default page size
}


def test_can_list_empty_jobs_200_with_address(client: TestClient) -> None:
    response = client.get(
        "/job",
        headers=get_auth_header(),
    )

    assert response.status_code == 200
    paginated_result = response.json()
    assert paginated_result == empty_result


def test_can_list_empty_jobs_200_without_address(client: TestClient) -> None:
    response = client.get(
        "/job",
        headers=get_auth_header(generate_jwt_token(wallet_address=None)),
    )

    assert response.status_code == 200
    paginated_result = response.json()
    assert paginated_result == empty_result


def test_cannot_list_jobs_400_with_unsupported_page_size(client: TestClient) -> None:
    response = client.get(
        "/job", headers=get_auth_header(), params={"page_size": Config.api_config.max_page_size + 1}
    )

    assert response.status_code == 400
    assert (
        response.text
        == '{"errors":[{"field":"page_size","message":"Input should be less than or equal to 10"}]}'
    )


def test_can_list_jobs_200_with_address_and_pagination(
    client: TestClient, session: Session
) -> None:
    def validate_result(
        response: Response,
        expected_result: list[str],
        *,
        page: int = 0,
        page_size: int = 5,
        total_pages: int | None = None,
    ) -> None:
        total_results = len(expected_result)
        if total_pages is None:
            total_pages = math.ceil(total_results / page_size)

        assert response.status_code == 200
        paginated_result = response.json()

        assert paginated_result["page"] == page
        assert paginated_result["total_pages"] == total_pages
        assert paginated_result["total_results"] == total_results
        assert isinstance(paginated_result["results"], list)
        assert (
            len(paginated_result["results"]) == page_size
            if page != total_pages - 1
            else total_results - page * page_size
        )
        assert [j["escrow_address"] for j in paginated_result["results"]] == expected_result[
            page * page_size : (page + 1) * page_size
        ]

    session.begin()
    user = User(
        wallet_address=user_address,
        cvat_email=cvat_email,
        cvat_id=1,
    )
    session.add(user)

    jobs_count = 10
    escrows = []
    for i in range(jobs_count):
        cvat_project, _, cvat_job = create_project_task_and_job(
            session, f"0x86e83d346041E8806e352681f3F14549C0d2BC6{i}", i + 1
        )
        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=user_address,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=utcnow() + timedelta(days=1),
        )
        session.add(assignment)
        escrows.append(cvat_project.escrow_address)
        session.commit()

    with (
        open("tests/utils/manifest.json") as data,
        patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
    ):
        manifest = json.load(data)
        mock_get_manifest.return_value = manifest

        # check default pagination parameters
        response = client.get(
            # With wallet address
            "/job",
            headers=get_auth_header(),
        )
        validate_result(response, escrows)

        # check custom pagination parameters
        for page_size in range(1, jobs_count + 1):
            total_pages = math.ceil(jobs_count / page_size)
            for page in range(total_pages):
                response = client.get(
                    "/job",
                    headers=get_auth_header(),
                    params={
                        "page_size": page_size,
                        "page": page,
                    },
                )

                validate_result(
                    response, escrows, page=page, page_size=page_size, total_pages=total_pages
                )


def test_can_list_jobs_200_with_fields(client: TestClient, session: Session) -> None:
    session.begin()
    user = User(
        wallet_address=user_address,
        cvat_email=cvat_email,
        cvat_id=1,
    )
    session.add(user)

    _, _, cvat_job = create_project_task_and_job(
        session, "0x86e83d346041E8806e352681f3F14549C0d2BC66", 1
    )
    assignment = Assignment(
        id=str(uuid.uuid4()),
        user_wallet_address=user_address,
        cvat_job_id=cvat_job.cvat_id,
        expires_at=utcnow() + timedelta(days=1),
    )
    session.add(assignment)
    session.commit()

    with (
        open("tests/utils/manifest.json") as data,
        patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
    ):
        manifest = json.load(data)
        mock_get_manifest.return_value = manifest

        required_fields = {
            "escrow_address",
            "chain_id",
            "job_type",
            "status",
            "qualifications",
            "updated_at",
        }
        selectable_fields = {"job_description", "created_at", "reward_amount", "reward_token"}

        all_schema_fields = required_fields | selectable_fields

        for fields in [None] + [
            list(combination)
            for fields_len in range(1, len(selectable_fields) + 1)
            for combination in combinations(selectable_fields, fields_len)
        ]:
            response = client.get(
                "/job",
                headers=get_auth_header(),
                params={"fields": ",".join(fields)} if fields else None,
            )
            assert response.status_code == 200
            jobs = response.json()["results"]
            assert set(jobs[0].keys()) == (
                (required_fields | set(fields)) if fields else all_schema_fields
            )


def test_can_list_jobs_200_with_sorting(client: TestClient, session: Session) -> None:
    # sort: asc, desc; sort_field: chain_id|job_type|created_at|updated_at
    session.begin()
    user = User(
        wallet_address=user_address,
        cvat_email=cvat_email,
        cvat_id=1,
    )
    session.add(user)

    cvat_projects: list[Project] = []
    cvat_tasks: list[Task] = []
    cvat_jobs: list[Job] = []

    for i in range(3):
        cvat_project, cvat_task, cvat_job = create_project_task_and_job(
            session, f"0x86e83d346041E8806e352681f3F14549C0d2BC6{i}", i + 1
        )
        cvat_job.touch(session, touch_parent=True)
        cvat_projects.append(cvat_project)
        cvat_tasks.append(cvat_task)
        cvat_jobs.append(cvat_job)

        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=user_address,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=utcnow() + timedelta(hours=i + 1),
            status=AssignmentStatuses.created if i % 2 else AssignmentStatuses.completed,
            completed_at=utcnow() if not i % 2 else None,
        )
        session.add(assignment)
        session.commit()

    last_updated_job = cvat_jobs[1]
    last_updated_job.touch(session, touch_parent=True)
    session.commit()

    assert all(obj.updated_at is not None for obj in cvat_jobs + cvat_tasks + cvat_projects)

    with (
        open("tests/utils/manifest.json") as data,
        patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
    ):
        manifest = json.load(data)
        mock_get_manifest.return_value = manifest

        for sort_field in (
            "chain_id",
            "job_type",
            "created_at",
            "updated_at",
        ):
            response_asc = client.get(
                "/job",
                headers=get_auth_header(),
                params={"sort_field": sort_field, "sort": "asc"},
            )
            assert response_asc.status_code == 200
            result_acs = [job["escrow_address"] for job in response_asc.json()["results"]]
            assert result_acs

            response_desc = client.get(
                "/job",
                headers=get_auth_header(),
                params={"sort_field": sort_field, "sort": "desc"},
            )

            assert response_desc.status_code == 200
            result_desc = [job["escrow_address"] for job in response_desc.json()["results"]]
            assert result_desc
            result_acs.reverse()
            assert result_acs == result_desc

            if sort_field == "updated_at":
                assert result_desc[0] == last_updated_job.task.project.escrow_address


def test_can_list_jobs_200_with_filters(client: TestClient, session: Session):
    session.begin()
    user_1 = User(
        wallet_address=user_address,
        cvat_email=cvat_email,
        cvat_id=1,
    )
    session.add(user_1)

    pre_init_time = utcnow()

    cvat_projects: list[Project] = []
    cvat_jobs: list[Job] = []
    assignments: list[Assignment] = []
    for idx, project_status in enumerate(
        [
            ProjectStatuses.annotation,
            ProjectStatuses.completed,
            ProjectStatuses.validation,
            ProjectStatuses.canceled,
            ProjectStatuses.recorded,
            # TODO: ProjectStatuses.deleted,
            # raise NotImplementedError(f"Unknown status {project.status}")
            # NotImplementedError: Unknown status deleted
        ]
    ):
        cvat_project = create_project(
            session,
            f"0x86e83d346041E8806e352681f3F14549C0d2BC{idx}",
            idx + 1,
            status=project_status,
        )
        cvat_task = create_task(session, idx + 1, cvat_project.cvat_id)
        cvat_job = create_job(session, idx + 1, cvat_task.cvat_id, cvat_project.cvat_id)

        cvat_projects.append(cvat_project)
        cvat_jobs.append(cvat_job)

        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=user_1.wallet_address,
            cvat_job_id=cvat_job.cvat_id,
            status=AssignmentStatuses.created,
            expires_at=utcnow() + timedelta(hours=1),
            completed_at=pre_init_time + timedelta(seconds=1)
            if project_status == ProjectStatuses.completed
            else None,
        )

        session.add(assignment)
        assignments.append(assignment)
        cvat_job.touch(session)
        session.commit()  # imitate different created_dates

    middle_init_time = utcnow()

    updated_cvat_project_ids = set()
    for job in cvat_jobs[len(cvat_jobs) // 2 :]:
        job.touch(session)
        updated_cvat_project_ids.add(job.task.cvat_project_id)
    session.commit()

    post_init_time = utcnow() + timedelta(seconds=1)

    with (
        open("tests/utils/manifest.json") as data,
        patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
    ):
        manifest = json.load(data)
        mock_get_manifest.return_value = manifest

        for filter_key, filter_values in {
            "status": (
                (
                    APIJobStatuses.active.value,
                    3,
                ),  # ProjectStatuses::annotation,completed,validation
                (APIJobStatuses.completed.value, 1),
                (APIJobStatuses.canceled.value, 1),
            ),
            "chain_id": ((cvat_projects[0].chain_id, len(cvat_projects)),),
            "job_type": (
                (cvat_projects[0].job_type, len(cvat_projects)),
                (TaskTypes.image_boxes_from_points.value, 0),
            ),
            "created_after": (
                (str(pre_init_time - timedelta(minutes=1)), len(cvat_projects)),
                (str(post_init_time), 0),
            ),
            "updated_after": (
                (str(pre_init_time - timedelta(minutes=1)), len(cvat_projects)),
                (str(middle_init_time), len(updated_cvat_project_ids)),
                (str(post_init_time + timedelta(minutes=1)), 0),
            ),
        }.items():
            for filter_value, expected_count in filter_values:
                response = client.get(
                    "/job", headers=get_auth_header(), params={filter_key: filter_value}
                )

                assert response.status_code == 200
                paginated_result = response.json()
                assert paginated_result["total_results"] == expected_count, (
                    filter_key,
                    filter_value,
                )


def test_can_list_jobs_200_check_values(client: TestClient, session: Session) -> None:
    session.begin()
    user = User(
        wallet_address=user_address,
        cvat_email=cvat_email,
        cvat_id=1,
    )
    session.add(user)

    cvat_project, cvat_task, cvat_first_job = create_project_task_and_job(
        session, "0x86e83d346041E8806e352681f3F14549C0d2BC66", 1
    )

    cvat_second_job = create_job(session, 2, cvat_task.cvat_id, cvat_project.cvat_id)
    session.commit()

    for job in (cvat_second_job, cvat_first_job):
        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=user_address,
            cvat_job_id=job.cvat_id,
            expires_at=utcnow() + timedelta(days=1),
        )
        session.add(assignment)
        job.touch(session)
        session.commit()

    with (
        open("tests/utils/manifest.json") as data,
        patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
    ):
        manifest = json.load(data)
        mock_get_manifest.return_value = manifest

        response = client.get(
            "/job",
            headers=get_auth_header(),
        )
        assert response.status_code == 200
        jobs = response.json()["results"]
        assert len(jobs) == 1
        job = jobs[0]

        assert job == {
            "escrow_address": cvat_project.escrow_address,
            "chain_id": cvat_project.chain_id,
            "job_type": cvat_project.job_type,
            "status": APIJobStatuses.active,
            "job_description": manifest["annotation"]["description"],
            "reward_amount": manifest["job_bounty"],
            "reward_token": "HMT",
            "created_at": cvat_project.created_at.isoformat().replace("+00:00", "Z"),
            "updated_at": cvat_first_job.task.project.updated_at.isoformat().replace("+00:00", "Z"),
            "qualifications": manifest.get("qualifications", []),
        }


def test_can_list_jobs_200_without_address(client: TestClient, session: Session) -> None:
    session.begin()
    _, _, cvat_job_1 = create_project_task_and_job(
        session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
    )
    create_project_task_and_job(session, "0x86e83d346041E8806e352681f3F14549C0d2BC68", 2)
    create_project_task_and_job(session, "0x86e83d346041E8806e352681f3F14549C0d2BC69", 3)

    user = User(
        wallet_address=user_address,
        cvat_email=cvat_email,
        cvat_id=1,
    )
    session.add(user)

    assignment = Assignment(
        id=str(uuid.uuid4()),
        user_wallet_address=user_address,
        cvat_job_id=cvat_job_1.cvat_id,
        expires_at=utcnow() + timedelta(days=1),
    )
    session.add(assignment)

    session.commit()

    with (
        open("tests/utils/manifest.json") as data,
        patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
    ):
        manifest = json.load(data)
        mock_get_manifest.return_value = manifest

        response = client.get(
            "/job",
            headers=get_auth_header(generate_jwt_token(wallet_address=None)),
        )

        assert response.status_code == 200
        paginated_result = response.json()
        assert paginated_result["page"] == 0
        assert paginated_result["total_pages"] == 1
        assert isinstance(paginated_result["results"], list)
        assert len(paginated_result["results"]) == 3
        assert paginated_result["total_results"] == 3

        for job in paginated_result["results"]:
            assert set(job.keys()) == {
                "escrow_address",
                "chain_id",
                "job_type",
                "status",
                "job_description",
                "reward_amount",
                "reward_token",
                "created_at",
                "updated_at",
                "qualifications",
            }


def test_cannot_list_jobs_401(client: TestClient) -> None:
    # Test API endpoint when auth token is missing or invalid
    for token, message in (
        (None, "Not authenticated"),
        ("invalid", "Could not validate credentials"),
    ):
        response = client.get("/job", headers=get_auth_header(token) if token else None)

        assert response.status_code == 401
        assert response.json() == {"message": message}


def test_can_register_200(client: TestClient, session: Session) -> None:
    session.begin()
    with patch("src.endpoints.exchange.cvat_api.get_user_id") as mock_get_user:
        mock_get_user.return_value = 1
        response = client.post(
            "/register",
            headers=get_auth_header(),
        )

    assert response.status_code == 200
    user = response.json()
    db_user = session.query(User).where(User.wallet_address == user_address).first()
    assert user["wallet_address"] == db_user.wallet_address == user_address
    assert user["email"] == db_user.cvat_email == cvat_email


def test_cannot_register_400_with_duplicated_address(client: TestClient, session: Session) -> None:
    session.begin()
    user = User(
        wallet_address=user_address,
        cvat_email=cvat_email,
        cvat_id=1,
    )
    session.add(user)
    session.commit()
    new_cvat_email = "test2@hmt.ai"

    response = client.post(
        "/register",
        headers=get_auth_header(generate_jwt_token(email=new_cvat_email)),
    )
    assert response.status_code == 400
    assert response.json() == {"message": "User already exists"}


def test_cannot_register_400_with_duplicated_user(client: TestClient, session: Session) -> None:
    session.begin()
    new_user_address = "0x86e83d346041E8806e352681f3F14549C0d2BC61"
    user = User(
        wallet_address=new_user_address,
        cvat_email=cvat_email,
        cvat_id=1,
    )
    session.add(user)
    session.commit()
    response = client.post(
        "/register",
        headers=get_auth_header(),
    )
    assert response.status_code == 400
    assert response.json() == {"message": "User already exists"}
    assert new_user_address != user_address


def test_cannot_register_401(client: TestClient) -> None:
    # Test API endpoint when auth token is missing or invalid
    for token, message in (
        (None, "Not authenticated"),
        ("invalid", "Could not validate credentials"),
    ):
        response = client.post(
            "/register",
            headers=get_auth_header(token) if token else None,
        )

        assert response.status_code == 401
        assert response.json() == {"message": message}


def test_can_create_assignment_200(client: TestClient, session: Session) -> None:
    session.begin()
    cvat_project, cvat_task, cvat_job = create_project_task_and_job(
        session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
    )
    user = User(
        wallet_address=user_address,
        cvat_email=cvat_email,
        cvat_id=1,
    )
    session.add(user)
    session.commit()
    with (
        open("tests/utils/manifest.json") as data,
        patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
        patch("src.services.exchange.cvat_api") as cvat_api,
    ):
        manifest = json.load(data)
        mock_get_manifest.return_value = manifest

        assert {cvat_project.updated_at, cvat_task.updated_at, cvat_job.updated_at} == {None}
        response = client.post(
            "/assignment",
            headers=get_auth_header(),
            json={
                "escrow_address": cvat_project.escrow_address,
                "chain_id": cvat_project.chain_id,
            },
        )
        cvat_api.clear_job_annotations.assert_called_once()
        cvat_api.restart_job.assert_called_once_with(cvat_job.cvat_id, assignee_id=user.cvat_id)

        assert response.status_code == 200
        assignment = response.json()

        assert assignment.keys() == {
            "assignment_id",
            "escrow_address",
            "chain_id",
            "job_type",
            "url",
            "status",
            "reward_amount",
            "reward_token",
            "created_at",
            "updated_at",
            "expires_at",
        }

        db_assignment = (
            session.query(Assignment).filter_by(user_wallet_address=user_address).first()
        )
        assert assignment["escrow_address"] == cvat_project.escrow_address
        assert assignment["chain_id"] == cvat_project.chain_id
        assert assignment["assignment_id"] == db_assignment.id
        assert assignment["status"] == APIAssignmentStatuses.active
        assert db_assignment.status == AssignmentStatuses.created
        assert db_assignment.cvat_job_id == cvat_job.cvat_id

        for obj, Class in zip(
            (cvat_project, cvat_task, cvat_job), (Project, Task, Job), strict=False
        ):
            session.expire(obj, attribute_names=[Class.updated_at.name])
            assert obj.updated_at is not None
        assert cvat_project.updated_at > cvat_task.updated_at > cvat_job.updated_at


def test_cannot_create_assignment_401(client: TestClient) -> None:
    # Test API endpoint when auth token is missing or invalid
    for token, message in (
        (None, "Not authenticated"),
        ("invalid", "Could not validate credentials"),
    ):
        response = client.post(
            "/assignment",
            headers=get_auth_header(token) if token else None,
            json={"wallet_address": user_address, "cvat_email": cvat_email},
        )

        assert response.status_code == 401
        assert response.json() == {"message": message}


def test_can_list_assignments_200(client: TestClient, session: Session) -> None:
    session.begin()
    user_1 = User(
        wallet_address=user_address,
        cvat_email=cvat_email,
        cvat_id=1,
    )
    session.add(user_1)

    pre_init_time = utcnow()

    cvat_projects: list[Project] = []
    assignments: list[Assignment] = []
    for idx, (escrow_address, project_status) in enumerate(
        [
            ("0x86e83d346041E8806e352681f3F14549C0d2BC65", ProjectStatuses.annotation),
            ("0x86e83d346041E8806e352681f3F14549C0d2BC66", ProjectStatuses.completed),
            ("0x86e83d346041E8806e352681f3F14549C0d2BC67", ProjectStatuses.validation),
            ("0x86e83d346041E8806e352681f3F14549C0d2BC68", ProjectStatuses.recorded),
            ("0x86e83d346041E8806e352681f3F14549C0d2BC69", ProjectStatuses.canceled),
            ("0x86e83d346041E8806e352681f3F14549C0d2BC70", ProjectStatuses.deleted),
        ]
    ):
        cvat_project = create_project(session, escrow_address, idx + 1, status=project_status)
        cvat_task = create_task(session, idx + 1, cvat_project.cvat_id)
        cvat_job = create_job(session, idx + 1, cvat_task.cvat_id, cvat_project.cvat_id)

        cvat_projects.append(cvat_project)

        assignment_statuses = {
            ProjectStatuses.annotation: (
                AssignmentStatuses.created,
                AssignmentStatuses.completed,
                AssignmentStatuses.expired,
                AssignmentStatuses.canceled,
                AssignmentStatuses.rejected,
            ),
            ProjectStatuses.completed: (AssignmentStatuses.completed,),
            ProjectStatuses.validation: (AssignmentStatuses.completed,),
            ProjectStatuses.recorded: (AssignmentStatuses.completed,),
            ProjectStatuses.canceled: (
                AssignmentStatuses.created,
                AssignmentStatuses.completed,
            ),
            ProjectStatuses.deleted: (
                AssignmentStatuses.created,
                AssignmentStatuses.completed,
            ),
        }[project_status]

        for assignment_status in assignment_statuses:
            assignment = Assignment(
                id=str(uuid.uuid4()),
                user_wallet_address=user_1.wallet_address,
                cvat_job_id=cvat_job.cvat_id,
                status=assignment_status,
                expires_at=utcnow()
                if assignment_status == AssignmentStatuses.expired
                else pre_init_time + timedelta(hours=1),
                completed_at=pre_init_time + timedelta(minutes=30)
                if assignment_status == AssignmentStatuses.completed
                else None,
            )
            if assignment_status == AssignmentStatuses.expired:
                assignment.updated_at = assignment.expires_at
            elif assignment_status == AssignmentStatuses.completed:
                assignment.updated_at = assignment.completed_at
            elif assignment.status in [AssignmentStatuses.canceled, AssignmentStatuses.rejected]:
                assignment.updated_at = pre_init_time + timedelta(minutes=5)

            session.add(assignment)
            assignments.append(assignment)
            session.commit()

    post_init_time = utcnow() + timedelta(seconds=1)

    with (
        open("tests/utils/manifest.json") as data,
        patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
    ):
        manifest = json.load(data)
        mock_get_manifest.return_value = manifest

        for filter_key, filter_values in {
            "status": (
                (APIAssignmentStatuses.active.value, 3),
                (APIAssignmentStatuses.completed.value, 3),
                (APIAssignmentStatuses.canceled.value, 1),
                (APIAssignmentStatuses.expired.value, 1),
                (APIAssignmentStatuses.rejected.value, 1),
                (APIAssignmentStatuses.validation.value, 3),
            ),
            "escrow_address": ((cvat_projects[0].escrow_address, 5),),
            "chain_id": ((cvat_projects[0].chain_id, len(assignments)),),
            "assignment_id": (
                (assignments[0].id, 1),
                ("unknown", 0),
            ),
            "job_type": (
                (cvat_projects[0].job_type, len(assignments)),
                (TaskTypes.image_boxes_from_points.value, 0),
            ),
            "created_after": (
                (str(pre_init_time - timedelta(minutes=1)), len(assignments)),
                (str(post_init_time), 0),
            ),
            "updated_after": (
                (str(pre_init_time - timedelta(minutes=1)), len(assignments)),
                (str(post_init_time), len(assignments) - 4),
                (str(post_init_time + timedelta(minutes=5)), len(assignments) - 6),
                (str(post_init_time + timedelta(minutes=30)), len(assignments) - 12),
            ),
        }.items():
            for filter_value, expected_count in filter_values:
                response = client.get(
                    "/assignment", headers=get_auth_header(), params={filter_key: filter_value}
                )

                assert response.status_code == 200
                paginated_result = response.json()
                assert paginated_result["total_results"] == expected_count, (
                    filter_key,
                    filter_value,
                )


def test_can_list_assignments_200_with_sorting(client: TestClient, session: Session) -> None:
    # sort_field: chain_id|job_type|status|created_at|expires_at
    # sort: asc, desc
    session.begin()
    user = User(
        wallet_address=user_address,
        cvat_email=cvat_email,
        cvat_id=1,
    )
    session.add(user)

    for i in range(3):
        _, _, cvat_job = create_project_task_and_job(
            session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", i + 1
        )

        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=user_address,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=utcnow() + timedelta(hours=i + 1),
            status=AssignmentStatuses.created if i % 2 else AssignmentStatuses.completed,
            completed_at=utcnow() if not i % 2 else None,
        )
        session.add(assignment)
        session.commit()

    with (
        open("tests/utils/manifest.json") as data,
        patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
    ):
        manifest = json.load(data)
        mock_get_manifest.return_value = manifest

        for sort_field in (
            "chain_id",
            "job_type",
            "status",
            "created_at",
            "expires_at",
        ):
            response_asc = client.get(
                "/assignment",
                headers=get_auth_header(),
                params={"sort_field": sort_field, "sort": "asc"},
            )
            assert response_asc.status_code == 200
            result_acs = [a["assignment_id"] for a in response_asc.json()["results"]]
            assert result_acs

            response_desc = client.get(
                "/assignment",
                headers=get_auth_header(),
                params={"sort_field": sort_field, "sort": "desc"},
            )

            assert response_desc.status_code == 200
            result_desc = [a["assignment_id"] for a in response_desc.json()["results"]]
            assert result_desc
            result_acs.reverse()
            assert result_acs == result_desc


def test_can_resign_assignment_200(client: TestClient, session: Session) -> None:
    session.begin()
    cvat_project, cvat_task, cvat_job = create_project_task_and_job(
        session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
    )
    user = User(
        wallet_address=user_address,
        cvat_email=cvat_email,
        cvat_id=1,
    )

    assignment = Assignment(
        id=str(uuid.uuid4()),
        user_wallet_address=user_address,
        cvat_job_id=cvat_job.cvat_id,
        expires_at=utcnow() + timedelta(hours=1),
    )
    session.add_all([user, assignment])
    session.commit()

    assert {cvat_job.updated_at, cvat_task.updated_at, cvat_job.updated_at} == {None}
    response = client.post(
        "/assignment/resign",
        headers=get_auth_header(),
        json={"assignment_id": assignment.id},
    )

    assert response.status_code == 200
    session.expire(assignment)
    assert assignment.status == AssignmentStatuses.canceled

    for obj, Class in zip((cvat_project, cvat_task, cvat_job), (Project, Task, Job), strict=False):
        session.expire(obj, attribute_names=[Class.updated_at.name])
        assert obj.updated_at is not None
    assert cvat_project.updated_at > cvat_task.updated_at > cvat_job.updated_at


def test_cannot_resign_assignment_401(client: TestClient) -> None:
    # Test API endpoint when auth token is missing or invalid
    for token, message in (
        (None, "Not authenticated"),
        ("invalid", "Could not validate credentials"),
    ):
        response = client.post(
            "/assignment/resign",
            headers=get_auth_header(token) if token else None,
            json={
                "assignment_id": 1,
            },
        )

        assert response.status_code == 401
        assert response.json() == {"message": message}


def test_cannot_resign_assignment_400_when_assignment_is_finished(
    client: TestClient, session: Session
) -> None:
    session.begin()
    _, _, cvat_job_1 = create_project_task_and_job(
        session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
    )
    user = User(
        wallet_address=user_address,
        cvat_email=cvat_email,
        cvat_id=1,
    )
    session.add(user)
    assignment = Assignment(
        id=str(uuid.uuid4()),
        user_wallet_address=user_address,
        cvat_job_id=cvat_job_1.cvat_id,
        expires_at=utcnow() + timedelta(hours=1),
        status=AssignmentStatuses.completed.value,
        completed_at=utcnow(),
    )
    session.add(assignment)
    session.commit()

    response = client.post(
        "/assignment/resign",
        headers=get_auth_header(),
        json={"assignment_id": assignment.id},
    )

    assert response.status_code == 400
    session.expire(assignment)
    assert assignment.status == AssignmentStatuses.completed


def test_cannot_resign_assignment_400_with_someone_elses_wallet_address(
    client: TestClient, session: Session
) -> None:
    session.begin()
    _, _, cvat_job_1 = create_project_task_and_job(
        session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
    )
    user_1 = User(
        wallet_address="0x86e83d346041E8806e352681f3F14549C0d2BC61",
        cvat_email="user_1@hmt.ai",
        cvat_id=1,
    )
    user_2 = User(
        wallet_address="0x86e83d346041E8806e352681f3F14549C0d2BC62",
        cvat_email="user_2@hmt.ai",
        cvat_id=2,
    )
    session.add(user_1)
    session.add(user_2)
    assignment = Assignment(
        id=str(uuid.uuid4()),
        user_wallet_address=user_1.wallet_address,
        cvat_job_id=cvat_job_1.cvat_id,
        expires_at=utcnow() + timedelta(hours=1),
    )
    session.add(assignment)
    session.commit()

    response = client.post(
        "/assignment/resign",
        headers=get_auth_header(
            generate_jwt_token(wallet_address=user_2.wallet_address, email=user_2.cvat_email)
        ),
        json={"assignment_id": assignment.id},
    )

    assert response.status_code == 400
    session.expire(assignment)
    assert assignment.status == AssignmentStatuses.created


def test_can_get_assignment_stats_by_worker_200(client: TestClient, session: Session) -> None:
    session.begin()
    cvat_jobs, assignments = [], []

    cvat_project, cvat_task = create_project_and_task(
        session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
    )
    for i in range(5):
        cvat_job = create_job(
            session,
            cvat_id=i + 1,
            cvat_task_id=cvat_task.cvat_id,
            cvat_project_id=cvat_project.cvat_id,
        )
        cvat_jobs.append(cvat_job)

    user = User(
        wallet_address=user_address,
        cvat_email=cvat_email,
        cvat_id=1,
    )
    session.add(user)
    for i, status in enumerate(
        (
            AssignmentStatuses.canceled,
            AssignmentStatuses.created,
            AssignmentStatuses.completed,
            AssignmentStatuses.expired,
            AssignmentStatuses.rejected,
        )
    ):
        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=user_address,
            cvat_job_id=cvat_jobs[i].cvat_id,
            expires_at=utcnow() + timedelta(hours=1),
            status=status,
            completed_at=utcnow() if status == AssignmentStatuses.completed else None,
        )
        session.add(assignment)
        assignments.append(assignment)
    session.commit()

    response = client.get(
        "/stats/assignment",
        headers=get_auth_header(),
    )

    assert response.status_code == 200
    stats = response.json()
    assert stats["assignments_total"] == len(assignments)
    assert stats["submissions_sent"] == 2  # completed and rejected
    assert stats["assignments_completed"] == 1
    assert stats["assignments_rejected"] == 1
    assert stats["assignments_expired"] == 1


def test_cannot_get_assignment_stats_by_worker_401(client: TestClient) -> None:
    # Test API endpoint when auth token is missing or invalid
    for token, message in (
        (None, "Not authenticated"),
        ("invalid", "Could not validate credentials"),
    ):
        response = client.get(
            "/stats/assignment",
            headers=get_auth_header(token) if token else None,
        )

        assert response.status_code == 401
        assert response.json() == {"message": message}


def test_can_get_oracle_stats(client: TestClient, session: Session) -> None:
    session.begin()
    user_1 = User(
        wallet_address="0x86e83d346041E8806e352681f3F14549C0d2BC60",
        cvat_email="user_1@hmt.ai",
        cvat_id=1,
    )
    user_2 = User(
        wallet_address="0x86e83d346041E8806e352681f3F14549C0d2BC61",
        cvat_email="user_2@hmt.ai",
        cvat_id=2,
    )
    session.add(user_1)
    session.add(user_2)

    for idx, (escrow_address, project_status, worker) in enumerate(
        [
            (
                "0x86e83d346041E8806e352681f3F14549C0d2BC66",
                ProjectStatuses.annotation,
                user_1,
            ),
            (
                "0x86e83d346041E8806e352681f3F14549C0d2BC67",
                ProjectStatuses.validation,
                user_1,
            ),
            (
                "0x86e83d346041E8806e352681f3F14549C0d2BC68",
                ProjectStatuses.canceled,
                user_2,
            ),
            (
                "0x86e83d346041E8806e352681f3F14549C0d2BC69",
                ProjectStatuses.completed,
                user_2,
            ),
        ]
    ):
        cvat_project = create_project(session, escrow_address, idx + 1, status=project_status)
        cvat_task = create_task(session, idx + 1, cvat_project.cvat_id)
        cvat_job = create_job(session, idx + 1, cvat_task.cvat_id, cvat_project.cvat_id)
        if project_status != ProjectStatuses.canceled:
            assignment_status = {
                ProjectStatuses.annotation: AssignmentStatuses.expired,
                ProjectStatuses.validation: AssignmentStatuses.rejected,
                ProjectStatuses.completed: AssignmentStatuses.completed,
            }[project_status]
            assignment = Assignment(
                id=str(uuid.uuid4()),
                user_wallet_address=worker.wallet_address,
                cvat_job_id=cvat_job.cvat_id,
                status=assignment_status,
                expires_at=utcnow()
                + timedelta(hours=1 if assignment_status != AssignmentStatuses.expired else 0),
                completed_at=utcnow()
                if assignment_status == AssignmentStatuses.completed
                else None,
            )
            session.add(assignment)

    session.commit()

    response = client.get("/stats")

    assert response.status_code == 200
    stats = response.json()
    assert stats == {
        "escrows_processed": 4,
        "escrows_active": 2,  # annotation and validation
        "escrows_cancelled": 1,
        "workers_total": 2,
        "assignments_completed": 1,
        "assignments_rejected": 1,
        "assignments_expired": 1,
    }


def test_can_list_jobs_200_check_updated_at(client: TestClient, session: Session) -> None:
    session.begin()

    jobs_count = 3
    users = [
        User(
            wallet_address=f"0x86e83d346041E8806e352681f3F14549C0d2BC6{i}",
            cvat_email=f"user_{i}@hmt.ai",
            cvat_id=i,
        )
        for i in range(1, jobs_count + 1)
    ]
    session.add_all(users)

    utcnow()
    cvat_project = create_project(session, "0x86e83d346041E8806e352681f3F14549C0d2BC66", 1)
    cvat_tasks: list[Task] = []
    cvat_jobs: list[Job] = []

    for i in range(jobs_count):
        cvat_tasks.append(create_task(session, i + 1, cvat_project.cvat_id))
        cvat_jobs.append(create_job(session, i + 1, cvat_tasks[i].cvat_id, cvat_project.cvat_id))

    session.commit()

    with (
        open("tests/utils/manifest.json") as data,
        patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
        patch("src.services.exchange.cvat_api"),
    ):
        manifest = json.load(data)
        mock_get_manifest.return_value = manifest

        # create assignment in each job
        for i in range(jobs_count):
            response = client.post(
                "assignment",
                headers=get_auth_header(
                    generate_jwt_token(
                        wallet_address=users[i].wallet_address,
                        email=users[i].cvat_email,
                    )
                ),
                json={
                    "escrow_address": cvat_project.escrow_address,
                    "chain_id": cvat_project.chain_id,
                },
            )
            assert (
                response.status_code == 200
            ), f"Status: {response.status_code}, reason: {response.text}"

            response = client.get(
                "/job",
                headers=get_auth_header(
                    generate_jwt_token(
                        wallet_address=users[i].wallet_address,
                        email=users[i].cvat_email,
                    )
                ),
            )
            assert response.status_code == 200
