from typing import Optional
from pydantic import BaseModel


class CvatWebhook(BaseModel):
    event: str
    job: Optional[dict]
    task: Optional[dict]
    before_update: Optional[dict]
