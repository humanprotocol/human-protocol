from __future__ import annotations

from dataclasses import dataclass, field


class DatasetValidationError(Exception):
    pass


class MismatchingAnnotations(DatasetValidationError):
    pass


class TooFewSamples(DatasetValidationError):
    pass


class InvalidCategories(DatasetValidationError):
    pass


class InvalidImageInfo(DatasetValidationError):
    pass


class InvalidCoordinates(DatasetValidationError):
    pass


class InvisibleSkeletonError(DatasetValidationError):
    pass


@dataclass
class ExcludedAnnotationInfo:
    message: str
    sample_id: str = field(kw_only=True)
    sample_subset: str = field(kw_only=True)


@dataclass
class ExcludedAnnotationsInfo:
    messages: list[ExcludedAnnotationInfo] = field(default_factory=list)

    excluded_count: int = 0
    "The number of excluded annotations. Can be different from len(messages)"

    total_count: int = 0

    def add_message(self, message: str, *, sample_id: str, sample_subset: str):
        self.messages.append(
            ExcludedAnnotationInfo(
                message=message, sample_id=sample_id, sample_subset=sample_subset
            )
        )
