from __future__ import annotations

from typing import TYPE_CHECKING

import src.services.cvat as cvat_service
from src.chain.escrow import get_escrow_manifest, validate_escrow
from src.core.config import CronConfig
from src.core.manifest import parse_manifest
from src.core.types import EscrowValidationStatuses
from src.db import SessionLocal
from src.db.utils import ForUpdateParams
from src.handlers.job_completion.factory import create_validator
from src.utils.logging import get_function_logger

if TYPE_CHECKING:
    import logging

    from sqlalchemy.orm import Session


def _handle_escrow_validation(
    logger: logging.Logger,
    session: Session,
    escrow_address: str,
    chain_id: int,
) -> None:
    logger = get_function_logger(logger)

    validate_escrow(chain_id, escrow_address)

    # TODO: lock the escrow once there is such a DB object
    escrow_projects = cvat_service.get_projects_by_escrow_address(
        session, escrow_address, limit=None, for_update=ForUpdateParams(nowait=True)
    )
    if not escrow_projects:
        raise AssertionError(f"Can't find projects for escrow '{escrow_address}'")

    manifest = parse_manifest(get_escrow_manifest(chain_id, escrow_address))

    with create_validator(
        manifest=manifest,
        escrow_address=escrow_address,
        chain_id=chain_id,
        session=session,
        escrow_projects=escrow_projects,
    ) as validator:
        validator.set_logger(logger)
        validator.validate()


def handle_escrows_validations(logger: logging.Logger) -> None:
    for _ in range(CronConfig.track_escrow_validations_chunk_size):
        with SessionLocal.begin() as session:
            # Need to work in separate transactions for each escrow, as a failing DB call
            # (e.g. a failed lock attempt) will abort the transaction. A nested transaction
            # can also be used for handling this.
            escrow_validation = cvat_service.lock_escrow_for_validation(session)
            if not escrow_validation:
                break

            escrow_address = escrow_validation.escrow_address
            chain_id = escrow_validation.chain_id

            update_kwargs = {}
            try:
                _handle_escrow_validation(logger, session, escrow_address, chain_id)

                # Change status so validation won't be attempted again
                update_kwargs["status"] = EscrowValidationStatuses.in_progress
            except Exception as e:
                logger.exception(e)

            cvat_service.update_escrow_validation(
                session,
                escrow_address=escrow_address,
                chain_id=chain_id,
                increase_attempts=True,  # increase attempts always to allow escrow rotation
                **update_kwargs,
            )
