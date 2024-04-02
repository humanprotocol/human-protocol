from hashlib import sha256


def compute_resulting_annotations_hash(data: bytes) -> str:
    return sha256(data, usedforsecurity=False).hexdigest()
