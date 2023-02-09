#!/usr/bin/env python3

import logging

import basemodels
from web3 import Web3

CALLBACK_URL = "http://google.com/webback"
GAS_PAYER = Web3.toChecksumAddress("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
FAKE_URL = "http://google.com/fake"
IMAGE_LABEL_BINARY = "image_label_binary"


def test_manifest(
    number_of_tasks=100,
    bid_amount=1.0,
    oracle_stake=0.05,
    expiration_date=0,
    minimum_trust=0.1,
    request_type=IMAGE_LABEL_BINARY,
    request_config=None,
    job_mode="batch",
) -> basemodels.Manifest:
    model = {
        "requester_restricted_answer_set": {
            "0": {"en": "English Answer 1"},
            "1": {
                "en": "English Answer 2",
                "answer_example_uri": "https://hcaptcha.com/example_answer2.jpg",
            },
        },
        "job_mode": job_mode,
        "request_type": request_type,
        "unsafe_content": False,
        "task_bid_price": bid_amount,
        "oracle_stake": oracle_stake,
        "expiration_date": expiration_date,
        "minimum_trust_server": minimum_trust,
        "minimum_trust_client": minimum_trust,
        "requester_accuracy_target": minimum_trust,
        "recording_oracle_addr": GAS_PAYER,
        "reputation_oracle_addr": GAS_PAYER,
        "reputation_agent_addr": GAS_PAYER,
        "instant_result_delivery_webhook": CALLBACK_URL,
        "requester_question": {"en": "How much money are we to make"},
        "requester_question_example": FAKE_URL,
        "job_total_tasks": number_of_tasks,
        "taskdata_uri": FAKE_URL,
    }

    if request_config:
        model.update({"request_config": request_config})

    manifest = basemodels.Manifest(model)
    manifest.validate()

    return manifest


manifest = test_manifest()

if __name__ == "__main__":
    logging.basicConfig()
    logging.getLogger("urllib3").setLevel(logging.INFO)
