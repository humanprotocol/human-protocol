class DatasetValidationError(Exception):
    pass


class TooFewGtError(DatasetValidationError):
    def __str__(self) -> str:
        return (
            "Too many GT images were excluded. "
            "Please check that all the GT images have correct annotations corresponding "
            "to the dataset specification."
        )


class LowQualityError(DatasetValidationError):
    pass


class TooSlowAnnotationError(DatasetValidationError):
    def __init__(self, current_progress: float, current_iteration: int):
        super().__init__()
        self.current_progress = current_progress
        self.current_iteration = current_iteration

    def __str__(self):
        return (
            f"Escrow annotation progress is too small: {self.current_progress:.2f}% "
            f"at the {self.current_iteration} iterations"
        )
