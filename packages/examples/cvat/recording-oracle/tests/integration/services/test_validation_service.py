import random
import unittest
import uuid

from src.core.types import Networks
from src.db import SessionLocal
from src.services.validation import (
    create_job,
    create_task,
    create_validation_result,
    get_job_by_cvat_id,
    get_job_by_id,
    get_task_by_escrow_address,
    get_task_by_id,
    get_task_validation_results,
    get_validation_result_by_assignment_id,
)


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        random.seed(42)
        self.session = SessionLocal()
        self.escrow_address = "0x" + "".join([str(random.randint(0, 9)) for _ in range(40)])
        self.chain_id = Networks.localhost
        self.cvat_id = 0
        self.annotator_wallet_address = "0x" + "".join(
            [str(random.randint(0, 9)) for _ in range(40)]
        )
        self.annotation_quality = 0.9
        self.assigment_id = str(uuid.uuid4())

    def tearDown(self):
        self.session.close()

    def test_create_and_get_task(self):
        task_id = create_task(
            session=self.session, escrow_address=self.escrow_address, chain_id=self.chain_id
        )

        task = get_task_by_id(self.session, task_id)
        assert task.chain_id == self.chain_id
        assert task.escrow_address == self.escrow_address

        other_task = get_task_by_escrow_address(self.session, self.escrow_address)
        assert task.id == other_task.id

    def test_create_and_get_job(self):
        task_id = create_task(
            session=self.session, escrow_address=self.escrow_address, chain_id=self.chain_id
        )
        job_id = create_job(self.session, self.cvat_id, task_id)

        job = get_job_by_cvat_id(self.session, self.cvat_id)
        assert job.task_id == task_id

        other_job = get_job_by_id(self.session, job_id)
        assert job == other_job

    def test_create_and_get_validation_result(self):
        task_id = create_task(
            session=self.session, escrow_address=self.escrow_address, chain_id=self.chain_id
        )
        job_id = create_job(self.session, self.cvat_id, task_id)
        vr_id = create_validation_result(
            self.session,
            job_id,
            self.annotator_wallet_address,
            self.annotation_quality,
            self.assigment_id,
        )

        vr = get_validation_result_by_assignment_id(self.session, self.assigment_id)
        assert vr.id == vr_id

        vrs = get_task_validation_results(self.session, task_id)
        assert len(vrs) == 1
        assert vrs[0] == vr
