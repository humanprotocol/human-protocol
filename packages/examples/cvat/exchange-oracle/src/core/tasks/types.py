from enum import Enum

from src.utils.enums import BetterEnumMeta


class TaskTypes(str, Enum, metaclass=BetterEnumMeta):
    image_label_binary = "image_label_binary"
    image_points = "image_points"
    image_boxes = "image_boxes"
    image_boxes_from_points = "image_boxes_from_points"
    image_skeletons_from_boxes = "image_skeletons_from_boxes"
    image_polygons = "image_polygons"
    audio_transcription = "audio_transcription"
