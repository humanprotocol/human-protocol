import unittest

from pydantic.error_wrappers import ValidationError
from basemodels import Preprocess, Pipeline


class PipelineTest(unittest.TestCase):
    def test_preprocess(self):
        config = {}
        p = Preprocess(pipeline=Pipeline.FaceBlurPipeline, config=config)

        self.assertEqual(p.pipeline, Pipeline.FaceBlurPipeline)
        self.assertEqual(p.config, config)

        p = Preprocess(pipeline=Pipeline.FaceBlurPipeline)

        self.assertIsNone(p.config)

    def test_preprocess_raise(self):
        with self.assertRaises(ValidationError):
            Preprocess()

        with self.assertRaises(ValidationError):
            Preprocess(pipeline="")

        with self.assertRaises(ValidationError):
            Preprocess(pipeline=Pipeline.FaceBlurPipeline, config=1)

    def test_preprocess_to_dict(self):
        config = {"radius": 3}
        p = Preprocess(pipeline=Pipeline.FaceBlurPipeline, config=config)

        self.assertEqual(
            p.to_dict(), {"pipeline": Pipeline.FaceBlurPipeline.value, "config": config}
        )

        p = Preprocess(pipeline=Pipeline.FaceBlurPipeline)

        self.assertEqual(p.to_dict(), {"pipeline": Pipeline.FaceBlurPipeline.value})
