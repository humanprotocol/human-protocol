from __future__ import annotations


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
