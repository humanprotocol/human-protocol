from src.chain.escrow import get_escrow_manifest
from src.core.manifest import parse_manifest
from src.handlers.job_creation.builders.factory import create_builder
from src.log import ROOT_LOGGER_NAME
from src.utils.logging import get_function_logger

module_logger = f"{ROOT_LOGGER_NAME}.cron.cvat"


def create_task(escrow_address: str, chain_id: int) -> None:
    logger = get_function_logger(module_logger)

    manifest = parse_manifest(get_escrow_manifest(chain_id, escrow_address))

    with create_builder(manifest, escrow_address, chain_id) as task_builder:
        task_builder.set_logger(logger)
        task_builder.build()
