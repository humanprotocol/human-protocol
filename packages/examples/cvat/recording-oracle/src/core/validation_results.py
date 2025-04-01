from dataclasses import dataclass

from src.core.validation_errors import DatasetValidationError
from src.core.validation_meta import ValidationMeta


@dataclass
class ValidationResult:
    job_results: dict[int, float]


@dataclass
class ValidationSuccess(ValidationResult):
    validation_meta: ValidationMeta
    average_quality: float


@dataclass
class ValidationFailure(ValidationResult):
    rejected_jobs: dict[int, DatasetValidationError]


@dataclass
class FinalResult(ValidationResult):
    validation_meta: ValidationMeta
    resulting_annotations: bytes
    average_quality: float
