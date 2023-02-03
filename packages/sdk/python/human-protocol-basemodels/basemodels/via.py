"""
The VIA Format defines a standard schema for data files containing the results
of annotations produced for each datapoint of a job, i.e. the tasks defined in
a job manifest. Each file takes the general form of:

{
    "datapoints": [{
        "task_uri": "https://mydomain.com/image.jpg",
        "metadata": {
            "filename": "image.jpg"
        },
        "class_attributes": {
            "0": {
                # This nested class_attributes field will soon be deprecated
                "class_attributes": {
                    "dog": False,
                    "cat": False
                }
            }
        },
        "regions": [{
            "region_attributes": {
                "region_key": "region_value"
            },
            "shape_attributes": {
                "coords": [x1, y1, x2, y2, x3, y3, x4, y4],
                "name": "shape_type"
            }
        }],
    }]
}


"""
from typing import Dict, List, Any, Optional, Union
from pydantic import BaseModel, HttpUrl


class RegionAttributesBaseModel(BaseModel):
    region_attributes: Dict[str, Any]
    shape_attributes: Dict[str, Any]


class ClassAttributeBaseModel(BaseModel):
    # inner class attributes field not required, here for legacy purposes
    class_attributes: Optional[Dict[str, Any]]
    regions: Optional[List[RegionAttributesBaseModel]]


class DatapointBaseModel(BaseModel):
    task_uri: HttpUrl
    metadata: Optional[Dict[str, Any]]
    class_attributes: Optional[Union[Any, Dict[str, ClassAttributeBaseModel]]]


class ViaDataManifest(BaseModel):
    """Main entrypoint to define the VIA Data Format"""

    datapoints: List[DatapointBaseModel]
    version: int = 1
