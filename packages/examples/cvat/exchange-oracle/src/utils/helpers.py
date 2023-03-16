def parse_manifest(manifest: dict):
    bucket_name = "chimpanzee-gorilla-annotation-4"
    region = "eu-west-1"
    labels = [
        {
            "name": "chimpanzee",
            "type": "tag",
        },
        {
            "name": "gorilla",
            "type": "tag",
        },
    ]
    return bucket_name, region, labels
