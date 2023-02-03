from typing import Optional

from basemodels import Manifest

from human_protocol_sdk.job import Job
from test.human_protocol_sdk.utils import manifest as sample_manifest

DEFAULT_GAS_PAYER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
DEFAULT_GAS_PAYER_PRIV = (
    "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
)


def create_job(
    manifest: Optional[Manifest] = None,
    gas_payer: Optional[str] = None,
    gas_payer_priv: Optional[str] = None,
) -> Job:
    """Creates sample Job instance"""
    manifest = manifest or sample_manifest
    credentials = {
        "gas_payer": gas_payer or DEFAULT_GAS_PAYER,
        "gas_payer_priv": gas_payer_priv or DEFAULT_GAS_PAYER_PRIV,
    }
    return Job(credentials=credentials, escrow_manifest=manifest)
