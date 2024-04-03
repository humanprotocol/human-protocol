from dataclasses import dataclass
from typing import Dict

from src.core.validation_errors import DatasetValidationError
from src.core.validation_meta import ValidationMeta


@dataclass
class ValidationSuccess:
    validation_meta: ValidationMeta
    resulting_annotations: bytes
    average_quality: float


@dataclass
class ValidationFailure:
    rejected_jobs: Dict[int, DatasetValidationError]
