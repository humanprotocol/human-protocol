def process_image_label_binary_annotations(
    annotations: list, raw_annotations: dict, bucket_url: str, assignee: str
) -> dict:
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
