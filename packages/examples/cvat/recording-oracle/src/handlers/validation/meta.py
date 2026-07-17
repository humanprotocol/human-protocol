from __future__ import annotations

from typing import TYPE_CHECKING

from src.core.annotation_meta import AnnotationMeta

if TYPE_CHECKING:
    import io

    from src.core.validation_meta import ValidationMeta


def parse_annotation_metafile(metafile: io.RawIOBase) -> AnnotationMeta:
    return AnnotationMeta.model_validate_json(metafile.read())


def serialize_validation_meta(validation_meta: ValidationMeta) -> bytes:
    return validation_meta.model_dump_json().encode()
