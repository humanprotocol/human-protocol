from typing import Optional, Type, Union

from pydantic import BaseModel

from src.core.types import (
    ExchangeOracleEventType,
    JobLauncherEventType,
    OracleWebhookTypes,
    RecordingOracleEventType,
)

EventTypeTag = Union[
    ExchangeOracleEventType,
    JobLauncherEventType,
    RecordingOracleEventType,
]


class OracleEvent(BaseModel):
    @classmethod
    def get_type(cls) -> EventTypeTag:
        return get_type_tag_for_event_class(cls)


class JobLauncherEvent_EscrowCreated(OracleEvent):
    pass  # escrow is enough


class JobLauncherEvent_EscrowCanceled(OracleEvent):
    pass  # escrow is enough


class RecordingOracleEvent_TaskCompleted(OracleEvent):
    pass  # escrow is enough for now


class RecordingOracleEvent_TaskRejected(OracleEvent):
    # no task_id, escrow is enough for now
    rejected_job_ids: list[int]


class ExchangeOracleEvent_TaskCreationFailed(OracleEvent):
    # no task_id, escrow is enough for now
    reason: str


class ExchangeOracleEvent_TaskFinished(OracleEvent):
    pass  # escrow is enough for now


_event_type_map = {
    JobLauncherEventType.escrow_created: JobLauncherEvent_EscrowCreated,
    JobLauncherEventType.escrow_canceled: JobLauncherEvent_EscrowCanceled,
    RecordingOracleEventType.task_completed: RecordingOracleEvent_TaskCompleted,
    RecordingOracleEventType.task_rejected: RecordingOracleEvent_TaskRejected,
    ExchangeOracleEventType.task_creation_failed: ExchangeOracleEvent_TaskCreationFailed,
    ExchangeOracleEventType.task_finished: ExchangeOracleEvent_TaskFinished,
}


def get_class_for_event_type(event_type: str) -> Type[OracleEvent]:
    event_class = next((v for k, v in _event_type_map.items() if k == event_type), None)

    if not event_class:
        raise KeyError(f"Unknown event type {event_type}")

    return event_class


def get_type_tag_for_event_class(
    event_class: Type[OracleEvent],
) -> EventTypeTag:
    event_type = next((k for k, v in _event_type_map.items() if v == event_class), None)

    if not event_type:
        raise KeyError(f"Unknown event class {event_class}")

    return event_type


def parse_event(
    sender: OracleWebhookTypes,
    event_type: str,
    event_data: Optional[dict] = None,
) -> OracleEvent:
    sender_events_mapping = {
        OracleWebhookTypes.job_launcher: JobLauncherEventType,
        OracleWebhookTypes.recording_oracle: RecordingOracleEventType,
        OracleWebhookTypes.exchange_oracle: ExchangeOracleEventType,
    }

    sender_events = sender_events_mapping.get(sender)
    if sender_events is not None:
        if not event_type in sender_events:
            raise ValueError(f"Unknown event '{sender}.{event_type}'")
    else:
        assert False, f"Unknown event sender type '{sender}'"

    event_class = get_class_for_event_type(event_type)
    return event_class.parse_obj(event_data or {})


def validate_event(sender: OracleWebhookTypes, event_type: str, event_data: dict):
    parse_event(sender=sender, event_type=event_type, event_data=event_data)
