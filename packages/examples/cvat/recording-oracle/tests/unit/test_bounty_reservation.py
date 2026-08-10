from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

from src.core.annotation_meta import AnnotationMeta, JobMeta
from src.handlers.completion.handlers import _EscrowExporter

from tests.utils.constants import ESCROW_ADDRESS, WALLET_ADDRESS1

CHAIN_ID = 1338


@pytest.fixture
def fxt_exporter():
    exporter = _EscrowExporter(
        escrow_address=ESCROW_ADDRESS, chain_id=CHAIN_ID, manifest=None, db_session=None
    )
    exporter.set_logger(MagicMock())
    return exporter


def _make_annotation_meta(assignment_ids: list[str]) -> AnnotationMeta:
    return AnnotationMeta(
        jobs=[
            JobMeta(
                job_id=i,
                task_id=1,
                annotator_wallet_address=WALLET_ADDRESS1,
                assignment_id=assignment_id,
                start_frame=0,
                stop_frame=1,
            )
            for i, assignment_id in enumerate(assignment_ids)
        ]
    )


def _patch_assignment_bounties(bounties: dict[str, str | None]):
    return patch(
        "src.services.validation.get_validation_result_by_assignment_id",
        side_effect=lambda _session, assignment_id: SimpleNamespace(
            assignment_bounty=bounties[assignment_id]
        ),
    )


class EscrowBountyTest:
    def test_can_sum_assignment_bounties(self, fxt_exporter):
        fxt_exporter.annotation_meta = _make_annotation_meta(["a1", "a2", "a3"])

        with _patch_assignment_bounties({"a1": "0.1", "a2": "0.2", "a3": "1"}):
            total_bounty = fxt_exporter._compute_total_bounty()

        assert total_bounty == Decimal("1.3")

    def test_can_report_no_bounty_if_unknown_for_all_assignments(self, fxt_exporter):
        fxt_exporter.annotation_meta = _make_annotation_meta(["a1", "a2"])

        with _patch_assignment_bounties({"a1": None, "a2": None}):
            total_bounty = fxt_exporter._compute_total_bounty()

        assert total_bounty is None

    def test_can_fail_if_bounty_is_unknown_for_some_assignments(self, fxt_exporter):
        fxt_exporter.annotation_meta = _make_annotation_meta(["a1", "a2"])

        with (
            _patch_assignment_bounties({"a1": "0.1", "a2": None}),
            pytest.raises(Exception, match="1 of 2 assignments have no reward specified"),
        ):
            fxt_exporter._compute_total_bounty()

    def test_can_sum_empty_results(self, fxt_exporter):
        fxt_exporter.annotation_meta = _make_annotation_meta([])

        with _patch_assignment_bounties({}):
            total_bounty = fxt_exporter._compute_total_bounty()

        assert total_bounty == Decimal(0)

    def test_can_reserve_remaining_funds(self, fxt_exporter):
        with (
            patch(
                "src.chain.escrow.get_raw_remaining_escrow_funds", return_value=10**19
            ) as mock_get_funds,
            patch("src.chain.escrow.get_escrow_fund_token_decimals", return_value=18),
        ):
            funds_to_reserve = fxt_exporter._compute_funds_to_reserve(Decimal("1.5"))

        mock_get_funds.assert_called_once_with(CHAIN_ID, ESCROW_ADDRESS)
        assert funds_to_reserve == 10**19

    def test_can_fail_if_reward_exceeds_remaining_funds(self, fxt_exporter):
        with (
            patch("src.chain.escrow.get_raw_remaining_escrow_funds", return_value=10**17),
            patch("src.chain.escrow.get_escrow_fund_token_decimals", return_value=18),
            pytest.raises(Exception, match="exceeds the remaining escrow funds"),
        ):
            fxt_exporter._compute_funds_to_reserve(Decimal(1))

    def test_can_reserve_remaining_funds_if_bounty_is_unknown(self, fxt_exporter):
        with (
            patch("src.chain.escrow.get_raw_remaining_escrow_funds", return_value=10**17),
            patch("src.chain.escrow.get_escrow_fund_token_decimals") as mock_get_decimals,
        ):
            funds_to_reserve = fxt_exporter._compute_funds_to_reserve(None)

        assert funds_to_reserve == 10**17
        mock_get_decimals.assert_not_called()
