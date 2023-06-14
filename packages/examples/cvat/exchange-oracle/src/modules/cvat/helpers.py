def parse_manifest(manifest: dict):
    bucket_name = "nurseshark-whaleshark-annotation2"
    region = "eu-west-2"
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
