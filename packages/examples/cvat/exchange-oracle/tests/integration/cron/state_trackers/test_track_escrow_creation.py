import unittest
import uuid

from src.core.types import ProjectStatuses
from src.crons.state_trackers import track_escrow_creation
from src.db import SessionLocal
from src.models.cvat import EscrowCreation, Project

from tests.utils.db_helper import create_job, create_project, create_task


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    def test_track_track_successful_escrow_creation(self):
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"

        cvat_project_ids = []
        for cvat_project_id in range(2):
            cvat_project = create_project(
                self.session, escrow_address, cvat_project_id, status=ProjectStatuses.creation
            )
            create_task(self.session, cvat_project_id, cvat_project_id)
            create_job(self.session, cvat_project_id, cvat_project_id, cvat_project_id)

            cvat_project_ids.append(cvat_project_id)

        escrow_creation = EscrowCreation(
            id=str(uuid.uuid4()),
            escrow_address=cvat_project.escrow_address,
            chain_id=cvat_project.chain_id,
            total_jobs=2,
        )
        self.session.add(escrow_creation)

        self.session.commit()

        track_escrow_creation()

        self.session.commit()

        updated_projects = (
            self.session.query(Project).where(Project.cvat_id.in_(cvat_project_ids)).all()
        )
        self.assertEqual(
            [p.status for p in updated_projects],
            [ProjectStatuses.annotation, ProjectStatuses.annotation],
        )
