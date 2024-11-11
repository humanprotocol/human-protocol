from pydantic import BaseModel


class AnnotationInfo(BaseModel):
    accuracy: float | int


class FrameResult(BaseModel):
    conflicts: list[dict]
    annotations: AnnotationInfo


class QualityReportData(BaseModel):
    frame_results: dict[str, FrameResult]
