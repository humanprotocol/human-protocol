class DatasetValidationError(Exception):
    pass


class TooFewGtError(DatasetValidationError):
    def __str__(self) -> str:
        return (
            "Too many GT images were excluded. "
            "Please check that all the GT images have correct annotations corresponding "
            "to the dataset specification."
        )


class LowAccuracyError(DatasetValidationError):
    pass
