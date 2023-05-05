from enum import Enum
from uuid import UUID
from typing import Optional, List, Dict, Any
from pydantic import (
    BaseModel,
    root_validator,
    ValidationError,
    conint,
    confloat,
    validator,
)


class RestrictedAudienceBrowserEnum(str, Enum):
    mobile = "mobile"
    tablet = "tablet"
    desktop = "desktop"
    modern_browser = "modern_browser"


class RestrictedAudienceConfidenceEnum(str, Enum):
    minimum_client_confidence = "minimum_client_confidence"


class RestrictedAudienceScore(BaseModel):
    score: confloat(ge=0, le=1)


class RestrictedAudience(BaseModel):
    lang: Optional[List[Dict[str, RestrictedAudienceScore]]]
    country: Optional[List[Dict[str, RestrictedAudienceScore]]]
    sitekey: Optional[List[Dict[str, RestrictedAudienceScore]]]
    serverdomain: Optional[List[Dict[str, RestrictedAudienceScore]]]
    browser: Optional[
        List[Dict[RestrictedAudienceBrowserEnum, RestrictedAudienceScore]]
    ]
    confidence: Optional[
        List[Dict[RestrictedAudienceConfidenceEnum, RestrictedAudienceScore]]
    ]
    reason: Optional[List[Dict[str, RestrictedAudienceScore]]]

    min_difficulty: Optional[conint(ge=0, le=4, strict=True)]
    min_user_score: Optional[confloat(ge=0, le=1)]
    max_user_score: Optional[confloat(ge=0, le=1)]

    launch_group_id: Optional[conint(ge=0, strict=True)]

    interests: Optional[List[conint(strict=True)]]

    def dict(self, **kwargs):
        kwargs["exclude_unset"] = True
        return super().dict(**kwargs)

    def json(self, **kwargs):
        kwargs["exclude_unset"] = True
        return super().json(**kwargs)

    @root_validator()
    def validate_score_fields(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        for entry, value in values.items():
            if value is None:
                continue
            if entry in [
                "lang",
                "country",
                "browser",
                "sitekey",
                "serverdomain",
                "confidence",
            ]:
                if isinstance(value, list):
                    for restriction in value:
                        if len(restriction) > 1:
                            raise ValueError("only 1 element per list item is allowed")
                        key = next(iter(restriction))
                        if entry in ["lang", "country", "sitekey"]:
                            if str(key) != str(key).lower():
                                raise ValueError("use lowercase")
        return values

    @validator("sitekey")
    def validate_sitekey(cls, value):
        if value is not None:
            for restriction in value:
                for sitekey in restriction:
                    try:
                        UUID(sitekey)
                    except:
                        raise ValidationError("invalid sitekey")
        return value
