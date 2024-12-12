from attrs import define


@define(kw_only=True)
class ValidationFrameStats:
    accumulated_quality: float = 0.0
    failed_attempts: int = 0
    accepted_attempts: int = 0
    total_uses: int = 0

    @property
    def rating(self) -> float:
        return (self.accepted_attempts + 1) / (self.total_uses + 1)


GtKey = str
GtStats = dict[GtKey, ValidationFrameStats]
