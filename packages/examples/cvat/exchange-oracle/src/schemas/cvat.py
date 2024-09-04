from pydantic import BaseModel


class CvatWebhook(BaseModel):
    event: str
    job: dict | None = None
    task: dict | None = None
    before_update: dict | None = None
