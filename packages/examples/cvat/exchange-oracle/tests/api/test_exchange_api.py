import json
import uuid
from datetime import datetime, timedelta
from time import sleep
from unittest.mock import patch

from fastapi.testclient import TestClient
from jose import jwt

from src.core.config import Config
from src.core.types import AssignmentStatuses, ProjectStatuses
from src.db import SessionLocal
from src.models.cvat import Assignment, Project, User
from src.schemas.exchange import AssignmentStatuses as APIAssignmentStatuses

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
            **(
                {"wallet_address": wallet_address} if wallet_address else {}
            ),  # TODO: why can it be optional in GET /job api?
            "email": email,
            "role": "HUMAN_APP",
        },
        Config.human_app_config.jwt_key,
    )


def get_auth_header(token: str = generate_jwt_token()) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_empty_list_jobs_200_with_address(client: TestClient) -> None:
    response = client.get(
        "/job",
        headers=get_auth_header(),
        params={"wallet_address": user_address},
    )

    assert response.status_code == 200
    paginated_result = response.json()
    # FIXME: total_pages 0
    assert paginated_result["page"] == 1
    assert isinstance(paginated_result["results"], list)
    assert len(paginated_result["results"]) == 0
    assert paginated_result["total_results"] == 0


def test_empty_list_jobs_200_without_address(client: TestClient) -> None:
    response = client.get(
        "/job",
        headers=get_auth_header(),
    )

    assert response.status_code == 200
    paginated_result = response.json()
    # FIXME: total_pages 0
    assert paginated_result["page"] == 1
    assert isinstance(paginated_result["results"], list)
    assert len(paginated_result["results"]) == 0
    assert paginated_result["total_results"] == 0


def test_list_jobs_200_with_address(client: TestClient) -> None:
    with SessionLocal.begin() as session:
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
            expires_at=datetime.now() + timedelta(days=1),
        )
        session.add(assignment)

        session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest

            # With wallet address
            response = client.get(
                "/job",
                headers=get_auth_header(),
                params={"wallet_address": user_address},
            )

            assert response.status_code == 200
            paginated_result = response.json()
            assert paginated_result["page"] == 1
            assert paginated_result["total_pages"] == 1
            assert isinstance(paginated_result["results"], list)
            assert len(paginated_result["results"]) == 1
            assert paginated_result["total_results"] == 1

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
                    "qualifications",
                }


# TODO: this test used to check that only jobs without assignment
# would be listed when wallet_address was not provided but now API changed
def test_list_jobs_200_without_address(client: TestClient) -> None:
    with SessionLocal.begin() as session:
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
            expires_at=datetime.now() + timedelta(days=1),
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
            assert paginated_result["page"] == 1
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
                    "qualifications",
                }


def test_list_jobs_401(client: TestClient) -> None:
    for token, message in (
        (None, "Not authenticated"),
        ("invalid", "Could not validate credentials"),
    ):
        response = client.get("/job", headers=get_auth_header(token) if token else None)

        assert response.status_code == 401
        assert response.json() == {"message": message}


def test_register_200(client: TestClient) -> None:
    with SessionLocal.begin() as session:
        with patch("src.endpoints.exchange.cvat_api.get_user_id") as mock_get_user:
            mock_get_user.return_value = 1
            response = client.post(
                "/register",
                headers=get_auth_header(),
                json={"wallet_address": user_address, "cvat_email": cvat_email},
            )

        assert response.status_code == 200
        user = response.json()
        db_user = session.query(User).where(User.wallet_address == user_address).first()
        assert user["wallet_address"] == db_user.wallet_address == user_address
        assert user["email"] == db_user.cvat_email == cvat_email


def test_register_400_duplicated_address(client: TestClient) -> None:
    with SessionLocal.begin() as session:
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
            json={"wallet_address": user_address, "cvat_email": new_cvat_email},
        )
        assert response.status_code == 400
        assert response.json() == {"message": "User already exists"}


def test_register_400_duplicated_user(client: TestClient) -> None:
    with SessionLocal.begin() as session:
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
            json={"wallet_address": user_address, "cvat_email": cvat_email},
        )
        assert response.status_code == 400
        assert response.json() == {"message": "User already exists"}
        assert new_user_address != user_address


def test_register_401(client: TestClient) -> None:
    for token, message in (
        (None, "Not authenticated"),
        ("invalid", "Could not validate credentials"),
    ):
        response = client.post(
            "/register",
            headers=get_auth_header(token) if token else None,
            json={"wallet_address": user_address, "cvat_email": cvat_email},
        )

        assert response.status_code == 401
        assert response.json() == {"message": message}


def test_create_assignment_200(client: TestClient) -> None:
    session = SessionLocal()
    session.begin()
    cvat_project, _, cvat_job = create_project_task_and_job(
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

    session.close()


def test_create_assignment_401(client: TestClient) -> None:
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


def test_list_assignments_200(client: TestClient) -> None:
    session = SessionLocal()
    session.begin()
    user_1 = User(
        wallet_address=user_address,
        cvat_email=cvat_email,
        cvat_id=1,
    )
    session.add(user_1)

    cvat_projects: list[Project] = []
    assignments: list[Assignment] = []
    for idx, (escrow_address, project_status) in enumerate(
        [
            ("0x86e83d346041E8806e352681f3F14549C0d2BC65", ProjectStatuses.annotation),
            ("0x86e83d346041E8806e352681f3F14549C0d2BC66", ProjectStatuses.validation),
            ("0x86e83d346041E8806e352681f3F14549C0d2BC68", ProjectStatuses.completed),
        ]
    ):
        cvat_project = create_project(session, escrow_address, idx + 1, status=project_status)
        cvat_task = create_task(session, idx + 1, cvat_project.cvat_id)
        cvat_job = create_job(session, idx + 1, cvat_task.cvat_id, cvat_project.cvat_id)

        cvat_projects.append(cvat_project)

        assignment_statuses = {
            ProjectStatuses.annotation: (AssignmentStatuses.expired, AssignmentStatuses.created),
            ProjectStatuses.validation: (
                AssignmentStatuses.completed,
                AssignmentStatuses.canceled,
                AssignmentStatuses.rejected,
            ),
            ProjectStatuses.completed: (AssignmentStatuses.completed,),
        }[project_status]

        for assignment_status in assignment_statuses:
            assignment = Assignment(
                id=str(uuid.uuid4()),
                user_wallet_address=user_1.wallet_address,
                cvat_job_id=cvat_job.cvat_id,
                status=assignment_status,
                expires_at=datetime.now()
                + timedelta(hours=1 if assignment_status != AssignmentStatuses.expired else 0),
                completed_at=datetime.now()
                if assignment_status == AssignmentStatuses.completed
                else None,
            )
            session.add(assignment)
            assignments.append(assignment)
            session.commit()
            sleep(0.5)

    with (
        open("tests/utils/manifest.json") as data,
        patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
    ):
        manifest = json.load(data)
        mock_get_manifest.return_value = manifest

        for filter_key, filter_values in {
            "status": (
                (APIAssignmentStatuses.active.value, 1),
                (APIAssignmentStatuses.completed.value, 2),
                (APIAssignmentStatuses.canceled.value, 1),
                (APIAssignmentStatuses.expired.value, 1),
                (APIAssignmentStatuses.rejected.value, 1),
                (APIAssignmentStatuses.validation.value, 1),
            ),
            "escrow_address": ((cvat_projects[0].escrow_address, 2),),
            "chain_id": ((cvat_projects[0].chain_id, len(assignments)),),
            "assignment_id": ((assignments[0].id, 1),),
            "job_type": ((cvat_projects[0].job_type, len(assignments)),),
            "created_after": ((str(assignments[0].created_at), len(assignments) - 1),),
            "updated_after": ((str(assignments[0].created_at), len(assignments) - 1),),
        }.items():
            for filter_value, expected_count in filter_values:
                response = client.get(
                    "/assignment", headers=get_auth_header(), params={filter_key: filter_value}
                )

                assert response.status_code == 200
                paginated_result = response.json()
                assert paginated_result["total_results"] == expected_count

    session.close()


def test_list_assignments_200_with_sorting(client: TestClient) -> None:
    # sort_field: chain_id|job_type|status|reward_amount|created_at|expires_at
    # sort: asc, desc
    session = SessionLocal()
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
            expires_at=datetime.now() + timedelta(hours=i + 1),
            status=AssignmentStatuses.created if i % 2 else AssignmentStatuses.completed,
            completed_at=datetime.now() if not i % 2 else None,
        )
        session.add(assignment)
        session.commit()
        sleep(0.5)

    with (
        open("tests/utils/manifest.json") as data,
        patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
    ):
        manifest = json.load(data)
        mock_get_manifest.return_value = manifest

        for sort_field in (
            # FIXME: sorting by these fields does not work
            # AttributeError: type object 'Assignment' has no attribute 'job_type'
            # "chain_id", FIXME: sorting does not work
            # "job_type",
            # "reward_amount",
            # "status",
            # FIXME: sorting by status works incorrectly
            # when there are assignments with the same status e.g.
            # created assignments: A1(complied), A2(created), A3(complied)
            # asc sorting is return A1(complied), A3(complied), A2(created) - correct
            # desc sorting is return A2(created), A1(complied), A3(complied) - incorrect,
            # should be A2(created), A3(complied), A1(complied)
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


def test_resign_job_200(client: TestClient) -> None:
    session = SessionLocal()
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
        expires_at=datetime.now() + timedelta(hours=1),
    )
    session.add(assignment)
    session.commit()

    response = client.post(
        "/assignment/resign",
        headers=get_auth_header(),
        json={"assignment_id": assignment.id},
    )

    assert response.status_code == 200
    session.expire(assignment)
    assert assignment.status == AssignmentStatuses.canceled
    session.close()


def test_resign_job_401(client: TestClient) -> None:
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


def test_resign_job_400_when_assignment_is_finished(client: TestClient) -> None:
    session = SessionLocal()
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
        expires_at=datetime.now() + timedelta(hours=1),
        status=AssignmentStatuses.completed.value,
        completed_at=datetime.now(),
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
    session.close()


def test_resign_job_400_with_someone_elses_wallet_address(client: TestClient) -> None:
    session = SessionLocal()
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
        expires_at=datetime.now() + timedelta(hours=1),
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
    session.close()


def test_get_assignment_stats_by_worker_200(client: TestClient) -> None:
    session = SessionLocal()
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
            expires_at=datetime.now() + timedelta(hours=1),
            status=status,
            completed_at=datetime.now() if status == AssignmentStatuses.completed else None,
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

    session.close()


def test_get_assignment_stats_by_worker_401(client: TestClient) -> None:
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


def test_get_oracle_stats(client: TestClient) -> None:
    session = SessionLocal()
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
                expires_at=datetime.now()
                + timedelta(hours=1 if assignment_status != AssignmentStatuses.expired else 0),
                completed_at=datetime.now()
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

    session.close()
