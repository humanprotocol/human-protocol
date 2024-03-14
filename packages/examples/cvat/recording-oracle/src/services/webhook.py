import datetime
import uuid
from enum import Enum
from typing import List, Optional, Union

from attrs import define
from sqlalchemy import case, update
from sqlalchemy.orm import Session
from sqlalchemy.sql import select

from src.core.config import Config
from src.core.oracle_events import OracleEvent, validate_event
from src.core.types import OracleWebhookStatuses, OracleWebhookTypes
from src.db.utils import ForUpdateParams
from src.db.utils import maybe_for_update as _maybe_for_update
from src.models.webhook import Webhook
from src.utils.enums import BetterEnumMeta
from src.utils.time import utcnow


class OracleWebhookDirectionTag(str, Enum, metaclass=BetterEnumMeta):
    incoming = "incoming"
    outgoing = "outgoing"


@define
class OracleWebhookQueue:
    direction: OracleWebhookDirectionTag
    default_sender: Optional[OracleWebhookTypes] = None

    def create_webhook(
        self,
        session: Session,
        escrow_address: str,
        chain_id: int,
        type: OracleWebhookTypes,
        signature: Optional[str] = None,
        event_type: Optional[str] = None,
        event_data: Optional[dict] = None,
        event: Optional[OracleEvent] = None,
    ) -> str:
        """
        Creates a webhook in a database
        """
        assert not event_data or event_type, "'event_data' requires 'event_type'"
        assert bool(event) ^ bool(
            event_type
        ), f"'event' and 'event_type' cannot be used together. Please use only one of the fields"

        if event_type:
            if self.direction == OracleWebhookDirectionTag.incoming:
                sender = type
            else:
                assert self.default_sender
                sender = self.default_sender
            validate_event(sender, event_type, event_data)
        elif event:
            event_type = event.get_type()
            event_data = event.dict()

        if self.direction == OracleWebhookDirectionTag.incoming and not signature:
            raise ValueError("Webhook signature must be specified for incoming events")
        elif self.direction == OracleWebhookDirectionTag.outgoing and signature:
            raise ValueError("Webhook signature must not be specified for outgoing events")

        if signature:
            existing_webhook_query = select(Webhook).where(Webhook.signature == signature)
            existing_webhook = session.execute(existing_webhook_query).scalars().first()
        else:
            existing_webhook = None

        if existing_webhook is None:
            webhook_id = str(uuid.uuid4())
            webhook = Webhook(
                id=webhook_id,
                signature=signature,
                escrow_address=escrow_address,
                chain_id=chain_id,
                type=type.value,
                event_type=event_type,
                event_data=event_data,
                direction=self.direction.value,
            )

            session.add(webhook)

            return webhook_id
        return existing_webhook.id

    def get_pending_webhooks(
        self,
        session: Session,
        type: OracleWebhookTypes,
        *,
        limit: int = 10,
        for_update: Union[bool, ForUpdateParams] = False,
    ) -> List[Webhook]:
        webhooks = (
            _maybe_for_update(session.query(Webhook), enable=for_update)
            .where(
                Webhook.direction == self.direction.value,
                Webhook.type == type.value,
                Webhook.status == OracleWebhookStatuses.pending.value,
                Webhook.wait_until <= utcnow(),
            )
            .limit(limit)
            .all()
        )
        return webhooks

    def update_webhook_status(
        self, session: Session, webhook_id: str, status: OracleWebhookStatuses
    ) -> None:
        upd = update(Webhook).where(Webhook.id == webhook_id).values(status=status.value)
        session.execute(upd)

    def handle_webhook_success(self, session: Session, webhook_id: str) -> None:
        upd = (
            update(Webhook)
            .where(Webhook.id == webhook_id)
            .values(attempts=Webhook.attempts + 1, status=OracleWebhookStatuses.completed)
        )
        session.execute(upd)

    def handle_webhook_fail(self, session: Session, webhook_id: str) -> None:
        upd = (
            update(Webhook)
            .where(Webhook.id == webhook_id)
            .values(
                attempts=Webhook.attempts + 1,
                status=case(
                    (
                        Webhook.attempts + 1 >= Config.webhook_max_retries,
                        OracleWebhookStatuses.failed.value,
                    ),
                    else_=OracleWebhookStatuses.pending.value,
                ),
                # TODO: consider exponential strategy
                wait_until=utcnow() + datetime.timedelta(seconds=Config.webhook_delay_if_failed),
            )
        )
        session.execute(upd)


inbox = OracleWebhookQueue(direction=OracleWebhookDirectionTag.incoming)
outbox = OracleWebhookQueue(
    direction=OracleWebhookDirectionTag.outgoing,
    default_sender=OracleWebhookTypes.recording_oracle,
)
