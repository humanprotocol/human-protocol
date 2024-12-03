from sqlalchemy.orm import Session

import src.services.cloud as cloud_service
from src.core.config import Config
from src.core.storage import (
    compose_data_bucket_prefix,
    compose_results_bucket_prefix,
)
from src.services.cloud.utils import BucketAccessInfo
from src.services.validation import mark_escrow_as_cleaned


def clean_escrow(db_session: Session, escrow_address: str, chain_id: int) -> None:
    storage_client = cloud_service.make_client(BucketAccessInfo.parse_obj(Config.storage_config))
    storage_client.remove_files(
        prefix=compose_data_bucket_prefix(escrow_address, chain_id),
    )
    storage_client.remove_files(
        prefix=compose_results_bucket_prefix(escrow_address, chain_id),
    )
    mark_escrow_as_cleaned(db_session, escrow_address=escrow_address, chain_id=chain_id)
