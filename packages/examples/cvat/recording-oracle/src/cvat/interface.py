from pydantic import BaseModel


class AnnotationInfo(BaseModel):
    accuracy: float | int

    class Config:
        extra = "allow"


class FrameResult(BaseModel):
    conflicts: list[dict]
    annotations: AnnotationInfo

    class Config:
        extra = "allow"


class QualityReportData(BaseModel):
    frame_results: dict[str, FrameResult]

    class Config:
        extra = "allow"
