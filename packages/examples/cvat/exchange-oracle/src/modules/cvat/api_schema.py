from pydantic import BaseModel
from typing import Optional


class CvatWebhook(BaseModel):
    event: str
    job: Optional[dict]
    task: Optional[dict]
    before_update: Optional[dict]
