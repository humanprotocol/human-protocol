from typing import Dict
from urllib.parse import urlparse

from src.chain.web3 import sign_message
from src.core.constants import Networks
from src.core.constants import CvatLabelTypes, JobTypes, Providers

type_mapping = {JobTypes.image_label_binary: CvatLabelTypes.tag.value}


def parse_data_url(data_url: str) -> tuple:
    parsed_url = urlparse(data_url)

    if parsed_url.netloc.endswith("s3.amazonaws.com"):
        # AWS S3 bucket
        return {
            "provider": Providers.aws.value,
            "bucket": parsed_url.netloc.split(".")[0],
        }
    elif parsed_url.netloc.endswith("storage.googleapis.com"):
        # Google Cloud Storage (GCS) bucket
        return {
            "provider": Providers.gcs.value,
            "bucket": parsed_url.netloc.split(".")[0],
        }
    else:
        raise ValueError(f"{parsed_url.netloc} cloud provider is not supported by CVAT")


def parse_manifest(manifest: dict) -> tuple:
    job_type = manifest["requestType"]
    if job_type not in JobTypes.__members__.values():
        raise ValueError(f"Oracle doesn't support job type {job_type}")

    parsed_url: dict = parse_data_url(manifest["dataUrl"])
    provider: str = parsed_url["provider"]
    bucket_name: str = parsed_url["bucket"]
    labels = [
        {"name": label, "type": type_mapping.get(job_type)}
        for label in manifest["labels"]
    ]
    return provider, bucket_name, labels, job_type


def compose_bucket_url(bucket_name: str, provider: str) -> str:
    match provider:
        case Providers.aws.value:
            return f"https://{bucket_name}.s3.amazonaws.com/"
        case Providers.gcs.value:
            return f"https://{bucket_name}.storage.googleapis.com/"


def prepare_recording_oracle_webhook_body(
    escrow_address: str,
    chain_id: Networks,
    s3_url: str,
) -> Dict:
    body = {"escrow_address": escrow_address, "chain_id": chain_id, "s3_url": s3_url}

    return body


def prepare_signature(escrow_address: str, chain_id: Networks, s3_url: str) -> str:
    message = prepare_recording_oracle_webhook_body(escrow_address, chain_id, s3_url)
    signature = sign_message(chain_id, message)

    return signature
