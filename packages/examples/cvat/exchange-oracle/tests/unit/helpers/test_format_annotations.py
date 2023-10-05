from src.handlers.annotation import process_image_label_binary_raw_annotations

from tests.unit.helpers.predefined_annotations import binary_annotations, raw_binary_annotations


def test_process_image_label_binary_annotations():
    bucket_url = "https://test.storage.googleapis.com/"
    assignee = "0x86e83d346041E8806e352681f3F14549C0d2BC68"
    handler = process_image_label_binary_raw_annotations

    annotations = handler([], raw_binary_annotations, bucket_url, assignee)
    annotations_check = [
        {
            "url": f"{bucket_url}1.jpg",
            "answers": [{"tag": "dummy_label", "assignee": assignee}],
        },
        {
            "url": f"{bucket_url}2.jpg",
            "answers": [{"tag": "dummy_label", "assignee": assignee}],
        },
        {
            "url": f"{bucket_url}3.jpg",
            "answers": [{"tag": "dummy_label", "assignee": assignee}],
        },
    ]
    assert annotations == annotations_check

    new_annotations = handler(binary_annotations, raw_binary_annotations, bucket_url, assignee)

    annotations_check = [
        {
            "url": f"{bucket_url}1.jpg",
            "answers": [
                {
                    "tag": "dummy_label",
                    "assignee": "0x86e83d346041E8806e352681f3F14549C0d2BC61",
                },
                {"tag": "dummy_label", "assignee": assignee},
            ],
        },
        {
            "url": f"{bucket_url}2.jpg",
            "answers": [
                {
                    "tag": "dummy_label",
                    "assignee": "0x86e83d346041E8806e352681f3F14549C0d2BC61",
                },
                {"tag": "dummy_label", "assignee": assignee},
            ],
        },
        {
            "url": f"{bucket_url}3.jpg",
            "answers": [
                {
                    "tag": "dummy_label",
                    "assignee": "0x86e83d346041E8806e352681f3F14549C0d2BC61",
                },
                {"tag": "dummy_label", "assignee": assignee},
            ],
        },
    ]
    assert new_annotations == annotations_check
