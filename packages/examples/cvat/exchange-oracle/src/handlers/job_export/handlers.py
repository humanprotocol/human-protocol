from __future__ import annotations

from typing import TYPE_CHECKING

import src.services.cvat as cvat_service
from src.chain.escrow import get_escrow_manifest, validate_escrow
from src.core.manifest import parse_manifest
from src.db.utils import ForUpdateParams
from src.handlers.job_export.factory import create_exporter

if TYPE_CHECKING:
    import logging

    from sqlalchemy.orm import Session


def handle_escrow_export(
    logger: logging.Logger,
    session: Session,
    escrow_address: str,
    chain_id: int,
) -> None:
    validate_escrow(chain_id, escrow_address)

    escrow_projects = cvat_service.get_projects_by_escrow_address(
        session, escrow_address, limit=None, for_update=ForUpdateParams(nowait=True)
    )

    manifest = parse_manifest(get_escrow_manifest(chain_id, escrow_address))

    with create_exporter(manifest, escrow_address, chain_id) as exporter:
        exporter.set_logger(logger)
        exporter.export(session, escrow_projects)
