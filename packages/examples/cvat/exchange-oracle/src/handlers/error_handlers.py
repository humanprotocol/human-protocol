""" Custom error handlers for the FastAPI"""
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from src.core.config import Config
from src.validators.validation import ValidationResult


def setup_error_handlers(app: FastAPI):
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_, exc):
        validation_result = ValidationResult()

        errors = exc.errors()

        for error in errors:
            field = error["loc"][-1]
            message = error["msg"]

            validation_result.add_error(field, message)

        return JSONResponse(content=validation_result.to_dict(), status_code=400)

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(_, exc):
        error_detail = exc.detail
        status_code = exc.status_code
        if isinstance(error_detail, ValidationResult):
            return JSONResponse(content=exc.detail.to_dict(), status_code=exc.status_code)
        if isinstance(error_detail, str):
            return JSONResponse(content={"message": error_detail}, status_code=status_code)
        if Config.environment == "development":
            return JSONResponse(content={"message": str(error_detail)}, status_code=status_code)

        return JSONResponse(content={"message": "Something went wrong"}, status_code=status_code)

    @app.exception_handler(Exception)
    async def generic_exception_handler(_, exc: Exception):
        message = (
            "Something went wrong"
            if Config.environment != "development"
            else ".".join(map(str, exc.args))
        )

        return JSONResponse(content={"message": message}, status_code=500)
