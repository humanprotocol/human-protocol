from src.config import Config
from urllib.parse import urlparse
from basemodels import Manifest


def download_manifest(manifest_url, client=Config.storage_config.client()):
    bucket_name, object_name = urlparse(manifest_url).path[1:].split("/", maxsplit=1)
    response = client.get_object(bucket_name=bucket_name, object_name=object_name)
    return Manifest.construct(**response.json())
