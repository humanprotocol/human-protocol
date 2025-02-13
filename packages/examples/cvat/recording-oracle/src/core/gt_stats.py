from attrs import define, field, frozen


@define(kw_only=True)
class ValidationFrameStats:
    accumulated_quality: float = 0.0
    failed_attempts: int = 0
    accepted_attempts: int = 0
    total_uses: int = 0
    enabled: bool = True

    @property
    def rating(self) -> float:
        return (self.accepted_attempts + 1) / (self.total_uses + 1)


@frozen(kw_only=True)
class GtKey:
    filename: str
    labels: frozenset[str] = field(default=frozenset(["DEFAULT_LABEL"]), converter=frozenset)


GtStats = dict[GtKey, ValidationFrameStats]
