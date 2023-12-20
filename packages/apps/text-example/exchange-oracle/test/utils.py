import datetime
import json
import random
import uuid
import zipfile
from dataclasses import dataclass
from pathlib import Path
from string import ascii_letters
from uuid import uuid4

from fastapi import HTTPException
from src.chain import sign_message, EventType, EscrowInfo
from src.config import Config
from src.db import AnnotationProject, JobRequest, Session, Statuses
from src.storage import upload_data
from starlette.responses import Response
from web3 import HTTPProvider, Web3
from web3.middleware import construct_sign_and_send_raw_middleware

from itertools import count


def assert_http_error_response(response: Response, error: HTTPException):
    assert response.status_code == error.status_code
    assert response.json()["detail"] == error.detail


def assert_no_entries_in_db(entry_type):
    with Session() as s:
        jobs = s.query(entry_type).all()
        assert len(jobs) == 0


def random_address(seed=None):
    if seed is not None:
        random.seed(seed)
    return "0x" + "".join([str(random.randint(0, 9)) for _ in range(40)])


def random_username(seed=None):
    if seed is not None:
        random.seed(seed)
    return "TEST_USER_" + "".join(random.choices(ascii_letters, k=16))


def random_escrow_info(event_type: EventType = EventType.ESCROW_CREATED, seed=None):
    if seed is not None:
        random.seed(seed)
    escrow_address = random_address()
    chain_id = Config.localhost.chain_id
    info = json.loads(
        EscrowInfo(
            escrow_address=escrow_address, chain_id=chain_id, event_type=event_type
        ).json()
    )
    return info, escrow_address, chain_id


def random_userinfo(seed=None):
    if seed is not None:
        random.seed(seed)
    address = random_address(seed)
    name = random_username(seed)
    return {"worker_address": address, "name": name}, address, name


def is_valid_uuid(obj):
    try:
        uuid.UUID(str(obj), version=4)
        return True
    except ValueError:
        return False


def add_job_request(
    status: Statuses = Statuses.pending,
    expiration_date=None,
    attempts=0,
    escrow_address=None,
    chain_id=None,
):
    if escrow_address is None:
        escrow_address = random_address()

    if chain_id is None:
        chain_id = Config.localhost.chain_id

    job_id = str(uuid4())

    with Session() as session:
        job = JobRequest(
            id=job_id,
            escrow_address=escrow_address,
            chain_id=chain_id,
            status=status,
            attempts=attempts,
        )
        if expiration_date is not None:
            job.expires_at = expiration_date
        session.add(job)
        session.commit()
    return job_id


project_counter = count(start=1)


def add_projects_to_job_request(job_id: str, n_projects: int, status: Statuses):
    with Session() as session:
        job = session.query(JobRequest).where(JobRequest.id == job_id).one()
        projects = []
        for _ in range(n_projects):
            i = next(project_counter)
            project = AnnotationProject(
                id=i, name=str(job.id) + f"__{i}", job_request=job, status=status
            )
            session.add(project)
            projects.append(project)
        session.commit()
    return projects


def upload_manifest_and_task_data():
    data_dir = Path(__file__).parent / "data"
    manifest_filepath = data_dir / "manifest.json"

    # update manifest times and s3 info
    with open(manifest_filepath, "r") as f:
        manifest_json = json.load(f)

    manifest_json["start_date"] = datetime.datetime.now().timestamp()
    manifest_json["expiration_date"] = (
        datetime.datetime.now() + datetime.timedelta(days=1)
    ).timestamp()
    manifest_json[
        "taskdata_uri"
    ] = f"http://{Config.storage_config.endpoint_url}/{Config.storage_config.results_bucket_name}/taskdata.json"

    with open(manifest_filepath, "w") as f:
        json.dump(manifest_json, f)

    upload_data(manifest_filepath, content_type="application/json")
    upload_data(data_dir / "taskdata.json", content_type="application/json")

    files_dir = data_dir / "txt_files"
    if len(list(Path(files_dir).glob("*.txt"))) == 0:
        with zipfile.ZipFile(files_dir / "data.zip") as data_zip:
            data_zip.extractall(path=files_dir)

    upload_data(files_dir, content_type="text/plain", glob_pattern="*.txt")
    return f"http://{Config.storage_config.endpoint_url}/{Config.storage_config.results_bucket_name}/{manifest_filepath.name}"


def get_web3_from_private_key(private_key: str):
    w3 = Web3(HTTPProvider())
    # Set default gas payer
    gas_payer = w3.eth.account.from_key(private_key)
    w3.middleware_onion.add(
        construct_sign_and_send_raw_middleware(gas_payer),
        "construct_sign_and_send_raw_middleware",
    )
    w3.eth.default_account = gas_payer.address
    return w3


@dataclass
class Signer:
    address: str
    private_key: str

    @property
    def web3(self):
        return get_web3_from_private_key(self.private_key)

    def sign(self, message):
        return sign_message(message, self.web3, self.private_key)[0]
