from pydantic import BaseModel


class _AnnotationInfo(BaseModel):
    accuracy: float | int


class _FrameResult(BaseModel):
    conflicts: list[dict]
    annotations: _AnnotationInfo


class QualityReportData(BaseModel):
    frame_results: dict[str, _FrameResult]
