from attrs import define


@define(kw_only=True)
class ValidationFrameStats:
    accumulated_quality: float = 0.0
    failed_attempts: int = 0
    accepted_attempts: int = 0

    @property
    def average_quality(self) -> float:
        return self.accumulated_quality / ((self.failed_attempts + self.accepted_attempts) or 1)


_TaskIdValFrameIdPair = tuple[int, int]

GtStats = dict[_TaskIdValFrameIdPair, ValidationFrameStats]
