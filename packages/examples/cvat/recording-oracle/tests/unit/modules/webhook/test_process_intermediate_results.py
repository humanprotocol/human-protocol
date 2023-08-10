from src.modules.webhook.process_intermediate_results import (
    process_image_label_binary_intermediate_results,
)


def test_process_image_label_binary_intermediate_results(intermediate_results):
    results = process_image_label_binary_intermediate_results(intermediate_results)

    assert all(
        [
            key in results
            for key in ("encodings", "dataset", "assignee_information", "raw_records")
        ]
    )
    assert len(results["encodings"]["tag"]) == 2
