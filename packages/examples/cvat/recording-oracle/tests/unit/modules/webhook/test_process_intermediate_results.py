from src.modules.webhook.process_intermediate_results import (
    process_image_label_binary_intermediate_results,
)

from src.modules.webhook.api_schema import ImageLabelBinaryJobResults


def test_process_image_label_binary_intermediate_results(intermediate_results):
    results = process_image_label_binary_intermediate_results(intermediate_results)
    ImageLabelBinaryJobResults.validate(results)
