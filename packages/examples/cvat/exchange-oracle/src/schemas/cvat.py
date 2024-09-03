from pydantic import BaseModel


class CvatWebhook(BaseModel):
    event: str
    job: dict | None
    task: dict | None
    before_update: dict | None
