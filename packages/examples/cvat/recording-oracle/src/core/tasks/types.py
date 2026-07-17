from src.utils.enums import BetterEnumMeta, StrEnum


class TaskTypes(StrEnum, metaclass=BetterEnumMeta):
    image_label_binary = "image_label_binary"
    image_points = "image_points"
    image_boxes = "image_boxes"
    image_boxes_from_points = "image_boxes_from_points"
    image_skeletons_from_boxes = "image_skeletons_from_boxes"
    image_polygons = "image_polygons"
    audio_transcription = "audio_transcription"
