from typing import Dict, List, Sequence

import attrs
from attrs import frozen
from datumaro.util import dump_json, parse_json

SkeletonBboxMapping = Dict[int, int]


# TODO: migrate to pydantic
@frozen
class RoiInfo:
    original_image_key: int
    bbox_id: int
    bbox_x: int
    bbox_y: int
    bbox_label: int
    roi_x: int
    roi_y: int
    roi_w: int
    roi_h: int

    def asdict(self) -> dict:
        return attrs.asdict(self, recurse=False)


RoiInfos = Sequence[RoiInfo]


@frozen(kw_only=True)
class TileInfo:
    roi_id: int
    roi_x: float  # top left
    roi_y: float  # top left
    roi_w: float
    roi_h: float


@frozen(kw_only=True)
class TilesetInfo:
    id: int
    label: int
    w: int
    h: int
    tiles: List[TileInfo]


TilesetInfos = Sequence[TilesetInfo]

# TilesetMap = Dict[int, TilesetInfo]


# class TaskMetaLayout:
#     TILESET_MAP_FILENAME = "tileset_map.json"
#     TILESET_NAME_PATTERN = "tileset-{}"

#     @classmethod
#     def make_tileset_sample_id(cls, tileset_id: int) -> str:
#         return cls.TILESET_NAME_PATTERN.format(tileset_id)


# class TaskMetaSerializer:
#     def dump_tileset_map(tile_map: TilesetMap, filename: str):
#         tile_map = {str(k): attrs.asdict(v) for k, v in tile_map.items()}
#         return dump_json(filename, tile_map, indent=True, append_newline=True)

#     def parse_tileset_map(filename: str) -> TilesetMap:
#         data = parse_json(filename)
#         return {
#             int(k): TilesetInfo(tiles=[TileInfo(**vv) for vv in v.pop("tiles", [])], **v)
#             for k, v in data.items()
#         }
