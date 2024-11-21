from pydantic import BaseModel

from src.core.types import ExchangeOracleEventTypes, OracleWebhookTypes, RecordingOracleEventTypes

EventTypeTag = ExchangeOracleEventTypes | RecordingOracleEventTypes


class OracleEvent(BaseModel):
    @classmethod
    def get_type(cls) -> EventTypeTag:
        return get_type_tag_for_event_class(cls)


class RecordingOracleEvent_JobCompleted(OracleEvent):
    pass  # escrow is enough for now


class RecordingOracleEvent_SubmissionRejected(OracleEvent):
    class RejectedAssignmentInfo(BaseModel):
        assignment_id: str
        reason: str

    # no task_id, escrow is enough for now
    assignments: list[RejectedAssignmentInfo]


class ExchangeOracleEvent_JobCreationFailed(OracleEvent):
    # no task_id, escrow is enough for now
    reason: str


class ExchangeOracleEvent_JobFinished(OracleEvent):
    pass  # escrow is enough for now


class ExchangeOracleEvent_EscrowCleaned(OracleEvent):
    pass


_event_type_map = {
    RecordingOracleEventTypes.job_completed: RecordingOracleEvent_JobCompleted,
    RecordingOracleEventTypes.submission_rejected: RecordingOracleEvent_SubmissionRejected,
    ExchangeOracleEventTypes.job_creation_failed: ExchangeOracleEvent_JobCreationFailed,
    ExchangeOracleEventTypes.job_finished: ExchangeOracleEvent_JobFinished,
    ExchangeOracleEventTypes.escrow_cleaned: ExchangeOracleEvent_EscrowCleaned,
}


def get_class_for_event_type(event_type: str) -> type[OracleEvent]:
    event_class = next((v for k, v in _event_type_map.items() if k == event_type), None)

    if not event_class:
        raise KeyError(f"Unknown event type {event_type}")

    return event_class


def get_type_tag_for_event_class(event_class: type[OracleEvent]) -> EventTypeTag:
    event_type = next((k for k, v in _event_type_map.items() if v == event_class), None)

    if not event_type:
        raise KeyError(f"Unknown event class {event_class}")

    return event_type


def parse_event(
    sender: OracleWebhookTypes, event_type: str, event_data: dict | None = None
) -> OracleEvent:
    sender_events_mapping = {
        OracleWebhookTypes.recording_oracle: RecordingOracleEventTypes,
        OracleWebhookTypes.exchange_oracle: ExchangeOracleEventTypes,
    }

    sender_events = sender_events_mapping.get(sender)
    if sender_events is not None:
        if event_type not in sender_events:
            raise ValueError(f"Unknown event '{sender}.{event_type}'")
    else:
        raise AssertionError(f"Unknown event sender type '{sender}'")

    event_class = get_class_for_event_type(event_type)
    return event_class.model_validate(event_data or {})


def validate_event(sender: OracleWebhookTypes, event_type: str, event_data: dict):
    parse_event(sender=sender, event_type=event_type, event_data=event_data)
