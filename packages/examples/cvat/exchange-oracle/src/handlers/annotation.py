from typing import List, Dict, Callable

from src.core.constants import JobTypes


def process_image_label_binary_raw_annotations(
    annotations: List[Dict], raw_annotations: List[Dict], bucket_url: str, assignee: str
) -> List[Dict]:
    if "image" in raw_annotations:
        for image in raw_annotations["image"]:
            url = bucket_url + image["name"]
            answer = {
                "tag": image["tag"]["label"] if "tag" in image else "",
                "assignee": assignee,
            }

            existing_image = next((x for x in annotations if x["url"] == url), None)

            if existing_image:
                existing_image["answers"].append(answer)
            else:
                annotations.append({"url": url, "answers": [answer]})

    return annotations


def get_annotations_handler(
    job_type: JobTypes,
) -> Callable[[List[Dict], List[Dict], str, str], List[Dict]]:
    match job_type:
        case JobTypes.image_label_binary.value:
            return process_image_label_binary_raw_annotations
        case _:
            raise ValueError(f"{job_type=} is not supported")
