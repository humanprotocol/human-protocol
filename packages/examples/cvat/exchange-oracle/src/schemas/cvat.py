from typing import Optional

from pydantic import BaseModel


class CvatWebhook(BaseModel):
    event: str
    job: Optional[dict] = None
    task: Optional[dict] = None
    before_update: Optional[dict] = None
