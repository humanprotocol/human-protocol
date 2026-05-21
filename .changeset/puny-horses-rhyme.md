---
"@human-protocol/core": major
"@human-protocol/sdk": minor
"@human-protocol/python-sdk": minor
---

Update escrow oracle fee handling so oracle fees are reserved independently from worker payouts.

The escrow contract now reserves oracle fees separately from worker payouts and transfers them on finalization, including when worker submissions are rejected. The SDK adds escrow fund amount accessors so clients and oracles can read the original funded amount and remaining worker payout funds.
