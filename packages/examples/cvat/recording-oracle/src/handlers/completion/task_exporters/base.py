from __future__ import annotations

from abc import ABCMeta, abstractmethod
from typing import TYPE_CHECKING

from src.core.config import Config
from src.core.storage import compose_data_bucket_filename, compose_results_bucket_filename
from src.handlers.validation.common import _TaskHandler
from src.services.cloud import make_client as make_cloud_client
from src.services.cloud.utils import BucketAccessInfo

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

    from src.core.manifest import ManifestBase


class TaskExporter(_TaskHandler, metaclass=ABCMeta):
    """
    Produces the task final annotations file. The Ground Truth annotations should be copied
    into the output.
    """

    def __init__(
        self,
        escrow_address: str,
        chain_id: int,
        manifest: ManifestBase,
        session: Session,
    ) -> None:
        super().__init__(escrow_address=escrow_address, chain_id=chain_id, manifest=manifest)
        self.session = session

        self._eo_bucket = BucketAccessInfo.parse_obj(Config.exchange_oracle_storage_config)

    def _download_annotation_result_file(self, filename: str) -> bytes:
        "Download a file from the exchange oracle's escrow results dir."
        return make_cloud_client(self._eo_bucket).download_file(
            compose_results_bucket_filename(self.escrow_address, self.chain_id, filename)
        )

    def _download_task_data_file(self, filename: str) -> bytes:
        "Download a file from the exchange oracle's escrow data dir."
        return make_cloud_client(self._eo_bucket).download_file(
            compose_data_bucket_filename(self.escrow_address, self.chain_id, filename)
        )

    @abstractmethod
    def export(self) -> bytes: ...
