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
from src.chain import sign_message, EscrowInfo
from src.config import Config
from src.db import ResultsProcessingRequest, Session, Statuses
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


def random_escrow_info(seed=None):
    if seed is not None:
        random.seed(seed)
    escrow_address = random_address()
    chain_id = Config.localhost.chain_id
    info = json.loads(
        EscrowInfo(escrow_address=escrow_address, chain_id=chain_id).json()
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


def add_processing_request(status: Statuses = Statuses.pending):
    id = str(uuid.uuid4())
    chain_id = Config.localhost.chain_id
    escrow_address = random_address()
    solution_url = f"http://{Config.storage_config.endpoint_url}/{Config.storage_config.results_bucket_name}/raw_results.jsonl"

    with Session() as session:
        request = ResultsProcessingRequest(
            id=id,
            chain_id=chain_id,
            escrow_address=escrow_address,
            solution_url=solution_url,
            status=status,
        )
        session.add(request)
        session.commit()
    return id


def upload_manifest_and_annotations():
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
    upload_data(data_dir / "raw_results.jsonl", content_type="application/json+jsonl")
    upload_data(data_dir / "ground_truth.json", content_type="application/json")

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
