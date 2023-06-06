def parse_manifest(manifest: dict):
    bucket_name = "example_bucket_name"
    region = "example_region"
    labels = [
        {
            "name": "label_1",
            "type": "tag",
        },
        {
            "name": "label_2",
            "type": "tag",
        },
    ]
    return bucket_name, region, labels
