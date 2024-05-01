import json


def build_gt_dataset(filenames: list[str]) -> str:
    data = {
        "licenses": [{"name": "", "id": 0, "url": ""}],
        "info": {
            "contributor": "",
            "date_created": "",
            "description": "",
            "url": "",
            "version": "",
            "year": "",
        },
        "categories": [{"id": 1, "name": "cat", "supercategory": ""}],
        "images": [],
        "annotations": [],
    }

    for filename in filenames:
        image_id = len(data["images"]) + 1
        data["images"].append(
            {
                "id": image_id,
                "width": 640,
                "height": 480,
                "file_name": filename,
                "license": 0,
                "flickr_url": "",
                "coco_url": "",
                "date_captured": 0,
            }
        )
        data["annotations"].append(
            {
                "id": len("annotations") + 1,
                "image_id": image_id,
                "category_id": 1,
                "segmentation": [],
                "area": 4,
                "bbox": [2, 4, 2, 2],
                "iscrowd": 0,
            }
        )

    return json.dumps(data)
