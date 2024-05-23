import json
import uuid
from datetime import datetime, timedelta
from unittest.mock import patch

from fastapi.testclient import TestClient

from src.core.types import AssignmentStatuses
from src.db import SessionLocal
from src.models.cvat import Assignment, User

from tests.utils.db_helper import create_project_task_and_job

escrow_address = "0x12E66A452f95bff49eD5a30b0d06Ebc37C5A94B6"
user_address = "0x86e83d346041E8806e352681f3F14549C0d2BC60"
cvat_email = "test@hmt.ai"


def test_empty_list_tasks_200_with_address(client: TestClient) -> None:
    response = client.get(
        "/tasks", headers={"signature": "sample"}, params={"wallet_address": user_address}
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) == 0


def test_empty_list_tasks_200_without_address(client: TestClient) -> None:
    response = client.get(
        "/tasks",
        headers={"signature": "sample"},
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) == 0


def test_list_tasks_200_with_address(client: TestClient) -> None:
    with (SessionLocal.begin() as session,):
        _, _, cvat_job_1 = create_project_task_and_job(
            session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        create_project_task_and_job(session, "0x86e83d346041E8806e352681f3F14549C0d2BC68", 2)
        create_project_task_and_job(session, "0x86e83d346041E8806e352681f3F14549C0d2BC69", 3)

        user = User(
            wallet_address=user_address,
            cvat_email="test@hmt.ai",
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
            patch("src.services.exchange.get_escrow_manifest") as mock_get_manifest,
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest

            # With wallet address
            response = client.get(
                "/tasks", headers={"signature": "sample"}, params={"wallet_address": user_address}
            )

            assert response.status_code == 200
            assert isinstance(response.json(), list)
            assert len(response.json()) == 1
            for task in response.json():
                assert task["assignment"]
                assert set(task.keys()) == {
                    "id",
                    "escrow_address",
                    "title",
                    "description",
                    "platform",
                    "job_bounty",
                    "job_size",
                    "job_time_limit",
                    "job_type",
                    "assignment",
                    "status",
                }


def test_list_tasks_200_without_address(client: TestClient) -> None:
    with (SessionLocal.begin() as session,):
        _, _, cvat_job_1 = create_project_task_and_job(
            session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        create_project_task_and_job(session, "0x86e83d346041E8806e352681f3F14549C0d2BC68", 2)
        create_project_task_and_job(session, "0x86e83d346041E8806e352681f3F14549C0d2BC69", 3)

        user = User(
            wallet_address=user_address,
            cvat_email="test@hmt.ai",
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
            patch("src.services.exchange.get_escrow_manifest") as mock_get_manifest,
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest

            response = client.get(
                "/tasks",
                headers={"signature": "sample"},
            )

            assert response.status_code == 200
            assert isinstance(response.json(), list)
            assert len(response.json()) == 2
            for task in response.json():
                assert not task["assignment"]
                assert set(task.keys()) == {
                    "id",
                    "escrow_address",
                    "title",
                    "description",
                    "platform",
                    "job_bounty",
                    "job_size",
                    "job_time_limit",
                    "job_type",
                    "assignment",
                    "status",
                }


def test_list_tasks_401(client: TestClient) -> None:
    response = client.get("/tasks", headers={"signature": "test"})

    assert response.status_code == 401
    assert response.json() == {"message": "Unauthorized"}

    response = client.get(
        "/tasks",
    )

    # Send a request without a signature
    assert response.status_code == 400
    assert response.json() == {"errors": [{"field": "signature", "message": "field required"}]}


def test_register_200(client: TestClient) -> None:
    with SessionLocal.begin() as session:
        with patch("src.endpoints.exchange.cvat_api.get_user_id") as mock_get_user:
            mock_get_user.return_value = 1
            response = client.put(
                "/register",
                headers={"signature": "sample"},
                json={"wallet_address": user_address, "cvat_email": cvat_email},
            )

        user = response.json()
        assert response.status_code == 200
        db_user = session.query(User).where(User.wallet_address == user_address).first()
        assert user["wallet_address"] == db_user.wallet_address
        assert user["cvat_id"] == db_user.cvat_id
        assert user["cvat_email"] == db_user.cvat_email
        assert user["wallet_address"] == user_address
        assert user["cvat_email"] == cvat_email


def test_register_200_duplicated_address(client: TestClient) -> None:
    with SessionLocal.begin() as session:
        user = User(
            wallet_address=user_address,
            cvat_email=cvat_email,
            cvat_id=1,
        )
        session.add(user)
        session.commit()
        new_cvat_email = "test2@hmt.ai"
        with (
            patch("src.endpoints.exchange.cvat_api.remove_user_from_org") as mock_remove_user,
            patch("src.endpoints.exchange.cvat_api.get_user_id") as mock_get_user,
        ):
            mock_get_user.return_value = 1
            response = client.put(
                "/register",
                headers={"signature": "sample"},
                json={"wallet_address": user_address, "cvat_email": new_cvat_email},
            )

        user = response.json()
        assert response.status_code == 200
        assert user["wallet_address"] == user_address
        assert user["cvat_email"] == new_cvat_email
        mock_remove_user.assert_called_once()


def test_register_200_duplicated_user(client: TestClient) -> None:
    with SessionLocal.begin() as session:
        user = User(
            wallet_address=user_address,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        session.add(user)
        session.commit()
        with (
            patch("src.endpoints.exchange.cvat_api.remove_user_from_org") as mock_remove_user,
            patch("src.endpoints.exchange.cvat_api.get_user_id") as mock_get_user,
        ):
            mock_get_user.return_value = 1
            new_cvat_email = "test2@hmt.ai"
            response = client.put(
                "/register",
                headers={"signature": "sample"},
                json={"wallet_address": user_address, "cvat_email": new_cvat_email},
            )

            user = response.json()
            assert response.status_code == 200
            assert user["wallet_address"] == user_address
            assert user["cvat_email"] == new_cvat_email
            mock_remove_user.assert_called_once()


def test_register_400(client: TestClient) -> None:
    with SessionLocal.begin() as session:
        new_user_address = "0x86e83d346041E8806e352681f3F14549C0d2BC61"
        user = User(
            wallet_address=new_user_address,
            cvat_email=cvat_email,
            cvat_id=1,
        )
        session.add(user)
        session.commit()
        response = client.put(
            "/register",
            headers={"signature": "sample"},
            json={"wallet_address": user_address, "cvat_email": cvat_email},
        )
        assert response.status_code == 400
        assert response.json() == {"message": "User already exists"}
        assert new_user_address != user_address


def test_register_401_unauthorized(client: TestClient) -> None:
    response = client.put(
        "/register",
        headers={"signature": "test"},
        json={"wallet_address": user_address, "cvat_email": cvat_email},
    )

    assert response.status_code == 401
    assert response.json() == {"message": "Unauthorized"}


def test_register_401_without_signature(client: TestClient) -> None:
    response = client.put(
        "/register", json={"wallet_address": user_address, "cvat_email": cvat_email}
    )

    assert response.status_code == 400
    assert response.json() == {"errors": [{"field": "signature", "message": "field required"}]}


def test_create_assignment_200(client: TestClient) -> None:
    session = SessionLocal()
    session.begin()
    cvat_project_1, _, cvat_job_1 = create_project_task_and_job(
        session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
    )
    user = User(
        wallet_address=user_address,
        cvat_email="test@hmt.ai",
        cvat_id=1,
    )
    session.add(user)
    session.commit()
    with (
        open("tests/utils/manifest.json") as data,
        patch("src.services.exchange.get_escrow_manifest") as mock_get_manifest,
        patch("src.services.exchange.cvat_api") as cvat_api,
    ):
        manifest = json.load(data)
        mock_get_manifest.return_value = manifest

        response = client.post(
            "/tasks/" + cvat_project_1.id + "/assignment",
            headers={"signature": "sample"},
            json={"wallet_address": user_address},
        )
        cvat_api.clear_job_annotations.assert_called_once()
        cvat_api.restart_job.assert_called_once_with(cvat_job_1.cvat_id, assignee_id=user.cvat_id)

    assert response.status_code == 200
    db_assignment = session.query(Assignment).filter_by(user_wallet_address=user_address).first()

    assert db_assignment.cvat_job_id == cvat_job_1.cvat_id
    assert db_assignment.user_wallet_address == user_address
    assert db_assignment.status == AssignmentStatuses.created
    assert response.json()["assignment"]
    session.close()


def test_create_assignment_400_unauthorized(client: TestClient) -> None:
    response = client.post(
        "/tasks/1/assignment",
        headers={"signature": "test"},
        json={"wallet_address": user_address, "cvat_email": cvat_email},
    )

    assert response.status_code == 401
    assert response.json() == {"message": "Unauthorized"}


def test_create_assignment_401_without_signature(client: TestClient) -> None:
    response = client.post(
        "/tasks/1/assignment", json={"wallet_address": user_address, "cvat_email": cvat_email}
    )
    assert response.status_code == 400
    assert response.json() == {"errors": [{"field": "signature", "message": "field required"}]}
