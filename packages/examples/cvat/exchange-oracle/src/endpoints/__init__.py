"""API endpoints"""

from fastapi import APIRouter, FastAPI
from fastapi_pagination import add_pagination

from src.core.config import Config
from src.endpoints.cvat import router as cvat_router
from src.endpoints.exchange import router as service_router
from src.endpoints.middleware import setup_middleware
from src.endpoints.throttling import add_throttling
from src.endpoints.webhook import router as webhook_router
from src.schemas import MetaResponse, ResponseError, ValidationErrorResponse

greet_router = APIRouter()


@greet_router.get("/", description="Endpoint describing the API", response_model=MetaResponse)
def meta_route() -> MetaResponse:
    networks = [Config.polygon_mainnet, Config.polygon_amoy, Config.aurora_testnet]

    networks_info = [
        {
            "chain_id": network.chain_id,
            "addr": network.addr,
        }
        for network in networks
    ]

    return MetaResponse.model_validate(
        {
            "message": "Exchange Oracle API",
            "version": "0.1.0",
            "supported_networks": networks_info,
        }
    )


def init_api(app: FastAPI) -> FastAPI:
    """Register API endpoints"""
    default_responses = {
        400: {"model": ValidationErrorResponse},
        404: {"model": ResponseError},
        405: {"model": ResponseError},
        422: {"model": ResponseError},
        500: {"model": ResponseError},
    }

    add_throttling(app)
    add_pagination(app)

    app.include_router(greet_router)
    app.include_router(cvat_router, responses=default_responses)
    app.include_router(webhook_router, responses=default_responses)
    app.include_router(service_router, responses=default_responses)

    setup_middleware(app)

    return app
