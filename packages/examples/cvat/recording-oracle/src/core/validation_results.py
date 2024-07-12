from dataclasses import dataclass
from typing import Dict

from src.core.validation_errors import DatasetValidationError
from src.core.validation_meta import ValidationMeta


@dataclass
class ValidationResult:
    job_results: Dict[int, float]


@dataclass
class ValidationSuccess(ValidationResult):
    validation_meta: ValidationMeta
    resulting_annotations: bytes
    average_quality: float


@dataclass
class ValidationFailure(ValidationResult):
    rejected_jobs: Dict[int, DatasetValidationError]
