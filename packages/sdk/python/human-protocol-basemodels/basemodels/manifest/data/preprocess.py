import enum
import typing
import pydantic


class Pipeline(str, enum.Enum):
    FaceBlurPipeline = "FaceBlurPipeline"
    OCRThinFilterPipeline = "OCRThinFilterPipeline"
    UploadPipeline = "UploadPipeline"


class Preprocess(pydantic.BaseModel):
    pipeline: Pipeline
    config: typing.Optional[dict]

    def to_dict(self):
        p = {"pipeline": self.pipeline.value}
        if self.config is not None:
            p["config"] = self.config
        return p
