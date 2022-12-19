#!/usr/bin/env python3
import logging
import os
from decimal import Decimal
from enum import Enum
from typing import Dict, List, Tuple, Optional, Any, TypedDict

from basemodels import Manifest
from eth_keys import keys
from eth_utils import decode_hex
from web3 import Web3
from web3.contract import Contract
from web3.types import TxReceipt, Wei

from human_protocol_sdk import utils
from human_protocol_sdk.eth_bridge import (
    get_hmtoken,
    get_hmtoken_interface,
    get_entity_topic,
    get_escrow,
    get_factory,
    deploy_factory,
    get_w3,
    handle_transaction_with_retry,
    Retry,
    HMTOKEN_ADDR,
)
from human_protocol_sdk.storage import (
    download,
    upload,
    get_public_bucket_url,
    get_key_from_url,
)

GAS_LIMIT = int(os.getenv("GAS_LIMIT", 4712388))
TRANSFER_EVENT = get_entity_topic(get_hmtoken_interface(), "Transfer")

# Explicit env variable that will use s3 for storing results.

LOG = logging.getLogger("human_protocol_sdk.job")

Status = Enum("Status", "Launched Pending Partial Paid Complete Cancelled")


class RaffleTxn(TypedDict):
    txn_succeeded: bool
    tx_receipt: Optional[TxReceipt]


def status(escrow_contract: Contract, gas_payer: str, gas: int = GAS_LIMIT) -> Enum:
    """Returns the status of the Job.

    Args:
        escrow_contract (Contract): the escrow contract of the Job.
        gas_payer (str): an ethereum address paying for the gas costs.
        gas (int): maximum amount of gas the caller is ready to pay.

    Returns:
        Enum: returns the status as an enumeration.

    """
    if gas is None:
        gas = GAS_LIMIT

    status_ = escrow_contract.functions.status().call(
        {"from": gas_payer, "gas": Wei(gas)}
    )
    return Status(status_ + 1)


def manifest_url(
    escrow_contract: Contract, gas_payer: str, gas: int = GAS_LIMIT
) -> str:
    """Retrieves the deployed manifest url uploaded on Job initialization.

    Args:
        escrow_contract (Contract): the escrow contract of the Job.
        gas_payer (str): an ethereum address paying for the gas costs.
        gas (int): maximum amount of gas the caller is ready to pay.

    Returns:
        str: returns the manifest url of Job's escrow contract.

    """

    if gas is None:
        gas = GAS_LIMIT

    return escrow_contract.functions.manifestUrl().call(
        {"from": gas_payer, "gas": Wei(gas)}
    )


def manifest_hash(
    escrow_contract: Contract, gas_payer: str, gas: int = GAS_LIMIT
) -> str:
    """Retrieves the deployed manifest hash uploaded on Job initialization.

    Args:
        escrow_contract (Contract): the escrow contract of the Job.
        gas_payer (str): an ethereum address paying for the gas costs.
        gas (int): maximum amount of gas the caller is ready to pay.

    Returns:
        str: returns the manifest hash of Job's escrow contract.

    """
    if gas is None:
        gas = GAS_LIMIT

    return escrow_contract.functions.manifestHash().call(
        {"from": gas_payer, "gas": Wei(gas)}
    )


def is_trusted_handler(
    escrow_contract: Contract, handler_addr: str, gas_payer: str, gas: int = GAS_LIMIT
) -> bool:
    if gas is None:
        gas = GAS_LIMIT

    return escrow_contract.functions.areTrustedHandlers(handler_addr).call(
        {"from": gas_payer, "gas": Wei(gas)}
    )


def launcher(escrow_contract: Contract, gas_payer: str, gas: int = GAS_LIMIT) -> str:
    """Retrieves the details on what eth wallet launched the job

    Args:
        escrow_contract (Contract): the escrow contract of the Job.
        gas_payer (str): an ethereum address paying for the gas costs.
        gas (int): maximum amount of gas the caller is ready to pay.

    Returns:
        str: returns the address of who launched the job.

    """
    if gas is None:
        gas = GAS_LIMIT

    return escrow_contract.functions.launcher().call(
        {"from": gas_payer, "gas": Wei(gas)}
    )


class Job:
    """A class used to represent a given Job launched on the HUMAN network.
    A Job  can be created from a manifest or by accessing an existing escrow contract
    from the Ethereum network. The manifest has to follow the Manifest model
    specification at https://github.com/hCaptcha/hmt-basemodels.

    A typical Job goes through the following stages:
    Launch: deploy an escrow contract to the network.
    Setup: store relevant attributes in the contract state.
    Pay: pay all job participatants in HMT when all the Job's tasks have been completed.

    Attributes:
        serialized_manifest (Dict[str, Any]): a dict representation of the Manifest model.
        factory_contract (Contract): the factory contract used to create Job's escrow contract.
        job_contract (Contract): the escrow contract of the Job.
        gas_payer (str): an ethereum address paying for the gas costs.
        gas_payer_priv (str): the private key of the gas_payer.
        amount (Decimal): an amount to be stored in the escrow contract.
        manifest_url (str): the location of the serialized manifest in IPFS.
        manifest_hash (str): SHA-1 hashed version of the serialized manifest.

    """

    def __init__(
        self,
        credentials: Dict[str, str],
        escrow_manifest: Manifest = None,
        factory_addr: str = None,
        escrow_addr: str = None,
        multi_credentials: List[Tuple] = [],
        retry: Retry = None,
        hmt_server_addr: str = None,
        hmtoken_addr: str = None,
        gas_limit: int = GAS_LIMIT,
    ):
        """Initializes a Job instance with values from a Manifest class and
        checks that the provided credentials are valid. An optional factory
        address is used to initialize the factory of the Job. Alternatively
        a new factory is created if no factory address is provided.

        Creating a new Job instance initializes the critical attributes correctly.
        >>> credentials = {
        ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> from test.human_protocol_sdk.utils import manifest
        >>> job = Job(credentials, manifest)
        >>> job.gas_payer == credentials["gas_payer"]
        True
        >>> job.gas_payer_priv == credentials["gas_payer_priv"]
        True
        >>> job.serialized_manifest["oracle_stake"]
        '0.05'
        >>> job.amount
        Decimal('100.0')

        Initializing a new Job instance with a factory address succeeds.
        >>> factory_addr = deploy_factory(**credentials)
        >>> job = Job(credentials, manifest, factory_addr)
        >>> job.factory_contract.address == factory_addr
        True

        >>> rep_oracle_pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"
        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.setup()
        True
        >>> launcher(job.job_contract, credentials['gas_payer']).lower() == job.factory_contract.address.lower()
        True

        Initializing an existing Job instance with a factory and escrow address succeeds.
        >>> credentials = {
        ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        ...     "rep_oracle_priv_key": b"ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> escrow_addr = job.job_contract.address
        >>> factory_addr = job.factory_contract.address
        >>> manifest_url = job.manifest_url
        >>> new_job = Job(credentials=credentials, factory_addr=factory_addr, escrow_addr=escrow_addr)
        >>> new_job.manifest_url == manifest_url
        True
        >>> new_job.job_contract.address == escrow_addr
        True
        >>> new_job.factory_contract.address == factory_addr
        True
        >>> new_job.launch(rep_oracle_pub_key)
        Traceback (most recent call last):
        AttributeError: The escrow has been already deployed.

        Creating a new Job instance with falsy credentials fails.
        >>> credentials = {
        ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
        ... }
        >>> job = Job(credentials, manifest)
        Traceback (most recent call last):
        ValueError: Given private key doesn't match the ethereum address.

        Args:
            manifest (Manifest): an instance of the Manifest class.
            credentials (Dict[str, str]): an ethereum address and its private key.
            factory_addr (str): an ethereum address of the factory.
            escrow_addr (str): an ethereum address of an existing escrow address.
            multi_credentials (List[Tuple]): a list of tuples with ethereum address, private key pairs.

        Raises:
            ValueError: if the credentials are not valid.

        """

        # holds global retry parameters for transactions
        if retry is None:
            self.retry = Retry()
        else:
            self.retry = retry

        main_credentials_valid = self._validate_credentials(
            multi_credentials, **credentials
        )
        if not main_credentials_valid:
            raise ValueError("Given private key doesn't match the ethereum address.")

        self.gas_payer = Web3.toChecksumAddress(credentials["gas_payer"])
        self.gas_payer_priv = credentials["gas_payer_priv"]
        self.multi_credentials = self._validate_multi_credentials(multi_credentials)
        self.hmt_server_addr = hmt_server_addr
        self.hmtoken_addr = HMTOKEN_ADDR if hmtoken_addr is None else hmtoken_addr
        self.gas = gas_limit or GAS_LIMIT

        # Initialize a new Job.
        if not escrow_addr and escrow_manifest:
            self.factory_contract = self._init_factory(factory_addr, credentials)
            self._init_job(escrow_manifest)

        # Access an existing Job.
        elif escrow_addr and factory_addr and not escrow_manifest:
            if not self._factory_contains_escrow(escrow_addr, factory_addr):
                raise ValueError(
                    "Given factory address doesn't contain the given escrow" " address."
                )
            self._access_job(factory_addr, escrow_addr, **credentials)

        # Handle incorrect usage
        else:
            raise ValueError("Job instantiation wrong, double-check arguments.")

    def launch(self, pub_key: bytes) -> bool:
        """Launches an escrow contract to the network, uploads the manifest
        to S3 with the public key of the Reputation Oracle and stores
        the S3 url to the escrow contract.

        >>> from test.human_protocol_sdk.utils import manifest
        >>> credentials = {
        ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> rep_oracle_pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"
        >>> job = Job(credentials, manifest)

        Deploying a new Job to the ethereum network succeeds.

        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.status()
        <Status.Launched: 1>

        >>> multi_credentials = [("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"), ("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a")]
        >>> job = Job(credentials, manifest, multi_credentials=multi_credentials)

        Inject wrong credentials on purpose to test out raffling

        >>> job.gas_payer_priv = "657b6497a355a3982928d5515d48a84870f057c4d16923eb1d104c0afada9aa8"
        >>> job.multi_credentials = [("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"), ("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a")]
        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.status()
        <Status.Launched: 1>

        Make sure we launched with raffled credentials

        >>> job.gas_payer
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
        >>> job.gas_payer_priv
        '5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'

        Args:
            pub_key (bytes): the public key of the Reputation Oracle.

        Returns:
            bool: returns True if Job initialization and Ethereum and IPFS transactions succeed.

        """
        if hasattr(self, "job_contract"):
            raise AttributeError("The escrow has been already deployed.")

        # Use factory to deploy a new escrow contract.
        trusted_handlers = [addr for addr, priv_key in self.multi_credentials]

        txn = self._create_escrow(trusted_handlers)

        if not txn["txn_succeeded"]:
            raise Exception("Unable to create escrow")

        tx_receipt = txn["tx_receipt"]
        events = self.factory_contract.events.Launched().processReceipt(tx_receipt)
        job_addr = events[0].get("args", {}).get("escrow", "")
        LOG.info("Job's escrow contract deployed to:{}".format(job_addr))
        self.job_contract = get_escrow(job_addr, self.hmt_server_addr)

        (hash_, manifest_url) = upload(self.serialized_manifest, pub_key)
        self.manifest_url = manifest_url
        self.manifest_hash = hash_
        return self.status() == Status.Launched and self.balance() == 0

    def setup(self, sender: str = None) -> bool:
        """Sets the escrow contract to be ready to receive answers from the Recording Oracle.
        The contract needs to be deployed and funded first.

        >>> from test.human_protocol_sdk.utils import manifest
        >>> credentials = {
        ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> rep_oracle_pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"
        >>> job = Job(credentials, manifest)

        A Job can't be setup without deploying it first.

        >>> job.setup()
        False

        >>> multi_credentials = [("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"), ("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a")]
        >>> job = Job(credentials, manifest, multi_credentials=multi_credentials)
        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.gas_payer_priv = "657b6497a355a3982928d5515d48a84870f057c4d16923eb1d104c0afada9aa8"
        >>> job.multi_credentials = [("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"), ("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a")]
        >>> job.setup()
        True

        Returns:
            bool: returns True if Job is in Pending state.

        Raises:
            AttributeError: if trying to setup the job before deploying it.

        """

        if not hasattr(self, "job_contract"):
            return False

        # Prepare setup arguments for the escrow contract.
        reputation_oracle_stake = int(
            Decimal(self.serialized_manifest["oracle_stake"]) * 100
        )
        recording_oracle_stake = int(
            Decimal(self.serialized_manifest["oracle_stake"]) * 100
        )
        reputation_oracle = str(self.serialized_manifest["reputation_oracle_addr"])
        recording_oracle = str(self.serialized_manifest["recording_oracle_addr"])
        hmt_amount = int(self.amount * 10**18)
        hmtoken_contract = get_hmtoken(self.hmtoken_addr, self.hmt_server_addr)

        tx_balance = None
        hmt_transferred = False
        contract_is_setup = False

        txn_event = "Transferring HMT"
        txn_info = {
            "gas_payer": self.gas_payer,
            "gas_payer_priv": self.gas_payer_priv,
            "gas": self.gas,
            "hmt_server_addr": self.hmt_server_addr,
        }
        if sender:
            txn_func = hmtoken_contract.functions.transferFrom
            func_args = [sender, self.job_contract.address, hmt_amount]
        else:
            txn_func = hmtoken_contract.functions.transfer
            func_args = [self.job_contract.address, hmt_amount]

        balance = utils.get_hmt_balance(
            self.gas_payer, self.hmtoken_addr, get_w3(self.hmt_server_addr)
        )

        # make sure there is enough HMT to fund the escrow
        if balance > hmt_amount:
            try:
                tx_receipt = handle_transaction_with_retry(
                    txn_func, self.retry, *func_args, **txn_info
                )

                hmt_transferred, tx_balance = utils.parse_transfer_transaction(
                    hmtoken_contract, tx_receipt
                )
            except Exception as e:
                LOG.debug(
                    f"{txn_event} failed with main credentials: {self.gas_payer}, {self.gas_payer_priv} due to {e}. Using secondary ones..."
                )

        if not hmt_transferred:
            raffle_txn_res = self._raffle_txn(
                self.multi_credentials, txn_func, func_args, txn_event
            )

            if raffle_txn_res["txn_succeeded"]:
                hmt_transferred, tx_balance = utils.parse_transfer_transaction(
                    hmtoken_contract, raffle_txn_res["tx_receipt"]
                )

        # give up
        if not hmt_transferred:
            LOG.warning(
                f"{txn_event} failed with all credentials, not continuing to setup."
            )
            return False

        txn_event = "Setup"
        txn_func = self.job_contract.functions.setup
        func_args = [
            reputation_oracle,
            recording_oracle,
            reputation_oracle_stake,
            recording_oracle_stake,
            self.manifest_url,
            self.manifest_hash,
        ]

        try:
            handle_transaction_with_retry(txn_func, self.retry, *func_args, **txn_info)
            contract_is_setup = True
        except Exception as e:
            LOG.debug(
                f"{txn_event} failed with main credentials: {self.gas_payer}, {self.gas_payer_priv} due to {e}. Using secondary ones..."
            )

        if not contract_is_setup:
            raffle_txn_res = self._raffle_txn(
                self.multi_credentials, txn_func, func_args, txn_event
            )
            contract_is_setup = raffle_txn_res["txn_succeeded"]

        if not contract_is_setup:
            LOG.warning(f"{txn_event} failed with all credentials.")

        return str(self.status()) == str(Status.Pending) and tx_balance == hmt_amount

    def add_trusted_handlers(self, handlers: List[str]) -> bool:
        """Add trusted handlers that can freely transact with the contract and
         perform aborts and cancels for example.

        >>> from test.human_protocol_sdk.utils import manifest
        >>> credentials = {
        ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> rep_oracle_pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"
        >>> job = Job(credentials, manifest)
        >>> job.launch(rep_oracle_pub_key)
        True

        Make sure we se set our gas payer as a trusted handler by default.

        >>> is_trusted_handler(job.job_contract, job.gas_payer, job.gas_payer)
        True

        >>> trusted_handlers = ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8', '0xD979105297fB0eee83F7433fC09279cb5B94fFC6']
        >>> job.add_trusted_handlers(trusted_handlers)
        True
        >>> is_trusted_handler(job.job_contract, '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', job.gas_payer)
        True
        >>> is_trusted_handler(job.job_contract, '0xD979105297fB0eee83F7433fC09279cb5B94fFC6', job.gas_payer)
        True

        Args:
            handlers (List[str]): a list of trusted handlers.

        Returns:
            bool: returns True if trusted handlers have been setup successfully.

        """
        txn_event = "Adding trusted handlers"
        txn_func = self.job_contract.functions.addTrustedHandlers
        txn_info = {
            "gas_payer": self.gas_payer,
            "gas_payer_priv": self.gas_payer_priv,
            "gas": self.gas,
            "hmt_server_addr": self.hmt_server_addr,
        }
        func_args = [handlers]

        try:
            handle_transaction_with_retry(txn_func, self.retry, *func_args, **txn_info)
            return True
        except Exception as e:
            LOG.info(
                f"{txn_event} failed with main credentials: {self.gas_payer}, {self.gas_payer_priv} due to {e}. Using secondary ones..."
            )

        raffle_txn_res = self._raffle_txn(
            self.multi_credentials, txn_func, func_args, txn_event
        )
        trusted_handlers_added = raffle_txn_res["txn_succeeded"]

        if not trusted_handlers_added:
            LOG.exception(f"{txn_event} failed with all credentials.")

        return trusted_handlers_added

    def bulk_payout(
        self,
        payouts: List[Tuple[str, Decimal]],
        results: Dict,
        pub_key: bytes,
        encrypt_final_results: bool = True,
        store_pub_final_results: bool = False,
    ) -> bool:
        """Performs a payout to multiple ethereum addresses. When the payout happens,
        final results are uploaded to IPFS and contract's state is updated to Partial or Paid
        depending on contract's balance.

        >>> from test.human_protocol_sdk.utils import manifest
        >>> credentials = {
        ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> rep_oracle_pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"
        >>> job = Job(credentials, manifest)
        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.setup()
        True
        >>> payouts = [("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", Decimal('20.0')), ("0x852023fbb19050B8291a335E5A83Ac9701E7B4E6", Decimal('50.0'))]
        >>> job.bulk_payout(payouts, {}, rep_oracle_pub_key)
        True

        The escrow contract is still in Partial state as there's still balance left.

        >>> job.balance()
        30000000000000000000
        >>> job.status()
        <Status.Partial: 3>

        Trying to pay more than the contract balance results in failure.

        >>> payouts = [("0x9d689b8f50Fd2CAec716Cc5220bEd66E03F07B5f", Decimal('40.0'))]
        >>> job.bulk_payout(payouts, {}, rep_oracle_pub_key)
        False

        Paying the remaining amount empties the escrow and updates the status correctly.

        >>> payouts = [("0x9d689b8f50Fd2CAec716Cc5220bEd66E03F07B5f", Decimal('30.0'))]
        >>> job.bulk_payout(payouts, {}, rep_oracle_pub_key)
        True
        >>> job.balance()
        0
        >>> job.status()
        <Status.Paid: 4>

        >>> multi_credentials = [("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"), ("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a")]
        >>> job = Job(credentials, manifest, multi_credentials=multi_credentials)
        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.setup()
        True
        >>> payouts = [("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", Decimal('20.0')), ("0x852023fbb19050B8291a335E5A83Ac9701E7B4E6", Decimal('50.0'))]
        >>> job.bulk_payout(payouts, {}, rep_oracle_pub_key)
        True

        Args:
            payouts (List[Tuple[str, int]]): a list of tuples with ethereum addresses and amounts.
            results (Dict): the final answer results stored by the Reputation Oracle.
            pub_key (bytes): the public key of the Reputation Oracle.
            encrypt_final_results (bool): Whether final results must be encrypted.
            store_pub_final_results (bool): Whether final results must be stored with public access.

        Returns:
            bool: returns True if paying to ethereum addresses and oracles succeeds.

        """
        bulk_paid = False
        txn_event = "Bulk payout"
        txn_func = self.job_contract.functions.bulkPayOut
        txn_info = {
            "gas_payer": self.gas_payer,
            "gas_payer_priv": self.gas_payer_priv,
            "gas": self.gas,
            "hmt_server_addr": self.hmt_server_addr,
        }

        hash_, url = upload(
            msg=results,
            public_key=pub_key,
            encrypt_data=encrypt_final_results,
            use_public_bucket=store_pub_final_results,
        )

        # Plain data will be publicly accessible
        url = get_public_bucket_url(url) if store_pub_final_results else url

        eth_addrs = list()
        hmt_amounts = list()

        for eth_addr, amount in payouts:
            eth_addrs.append(eth_addr)
            hmt_amounts.append(int(amount * 10**18))

        func_args = [eth_addrs, hmt_amounts, url, hash_, 1]

        try:
            tx_receipt = handle_transaction_with_retry(
                txn_func,
                self.retry,
                *func_args,
                **txn_info,
            )
            bulk_paid = self._check_transfer_event(tx_receipt)

            LOG.debug(
                f"Bulk paid: {bulk_paid} with main credentials: {self.gas_payer} and transaction receipt: {tx_receipt}."
            )
        except Exception as e:
            LOG.warning(
                f"{txn_event} failed with main credentials: {self.gas_payer}, {self.gas_payer_priv} due to {e}. Using secondary ones..."
            )

        if bulk_paid:
            return bulk_paid

        LOG.warning(
            f"{txn_event} failed with main credentials: {self.gas_payer}, {self.gas_payer_priv}. Using secondary ones..."
        )

        raffle_txn_res = self._raffle_txn(
            self.multi_credentials, txn_func, func_args, txn_event
        )
        tx_receipt = raffle_txn_res["tx_receipt"]
        bulk_paid = self._check_transfer_event(tx_receipt)

        LOG.debug(f"Bulk paid: {bulk_paid} with transaction receipt: {tx_receipt}.")

        if not bulk_paid:
            LOG.warning(f"{txn_event} failed with all credentials.")

        return bulk_paid

    def abort(self) -> bool:
        """Kills the contract and returns the HMT back to the gas payer.
        The contract cannot be aborted if the contract is in Partial, Paid or Complete state.

        >>> credentials = {
        ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> rep_oracle_pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"


        The escrow contract is in Partial state after a partial bulk payout so it can be aborted.

        >>> from test.human_protocol_sdk.utils import manifest
        >>> job = Job(credentials, manifest)

        The escrow contract is in Pending state after setup so it can be aborted.

        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.setup()
        True
        >>> payouts = [("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", Decimal('20.0'))]
        >>> job.bulk_payout(payouts, {}, rep_oracle_pub_key)
        True
        >>> job.abort()
        True

        The escrow contract is in Partial state after the first payout and it can't be aborted.


        The escrow contract is in Paid state after the a full bulk payout and it can't be aborted.

        >>> job = Job(credentials, manifest)
        >>> job.launch(rep_oracle_pub_key)
        True

        >>> job.setup()
        True
        >>> payouts = [("0x852023fbb19050B8291a335E5A83Ac9701E7B4E6", Decimal('100.0'))]
        >>> job.bulk_payout(payouts, {'results': 0}, rep_oracle_pub_key)
        True
        >>> job.abort()
        False
        >>> job.status()
        <Status.Paid: 4>


        Trusted handler should be able to abort an existing contract

        >>> trusted_handler = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
        >>> job = Job(credentials, manifest)
        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.setup()
        True
        >>> job.add_trusted_handlers([trusted_handler])
        True

        >>> handler_credentials = {
        ... 	"gas_payer": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        ... 	"gas_payer_priv": "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
        ...     "rep_oracle_priv_key": b"ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> access_job = Job(credentials=handler_credentials, factory_addr=job.factory_contract.address, escrow_addr=job.job_contract.address)
        >>> access_job.abort()
        True

        Returns:
            bool: returns True if contract has been destroyed successfully.

        """
        w3 = get_w3(self.hmt_server_addr)
        txn_event = "Job abortion"
        txn_func = self.job_contract.functions.abort
        txn_info = {
            "gas_payer": self.gas_payer,
            "gas_payer_priv": self.gas_payer_priv,
            "gas": self.gas,
            "hmt_server_addr": self.hmt_server_addr,
        }

        try:
            handle_transaction_with_retry(txn_func, self.retry, *[], **txn_info)
            # After abort the contract should be destroyed
            return w3.eth.getCode(self.job_contract.address) == b""
        except Exception as e:
            LOG.info(
                f"{txn_event} failed with main credentials: {self.gas_payer}, {self.gas_payer_priv} due to {e}. Using secondary ones..."
            )

        raffle_txn_res = self._raffle_txn(
            self.multi_credentials, txn_func, [], txn_event
        )
        job_aborted = raffle_txn_res["txn_succeeded"]

        if not job_aborted:
            LOG.exception(f"{txn_event} failed with all credentials.")

        return w3.eth.getCode(self.job_contract.address) == b""

    def cancel(self) -> bool:
        """Returns the HMT back to the gas payer. It's the softer version of abort as the contract is not destroyed.

        >>> credentials = {
        ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> rep_oracle_pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"
        >>> from test.human_protocol_sdk.utils import manifest
        >>> job = Job(credentials, manifest)

        The escrow contract is in Pending state after setup so it can be cancelled.

        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.setup()
        True
        >>> job.cancel()
        True

        Contract balance is zero and status is "Cancelled".

        >>> job.balance()
        0
        >>> job.status()
        <Status.Cancelled: 6>

        The escrow contract is in Partial state after the first payout and it can't be cancelled.

        >>> job = Job(credentials, manifest)
        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.setup()
        True
        >>> payouts = [("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", Decimal('20.0'))]
        >>> job.bulk_payout(payouts, {}, rep_oracle_pub_key)
        True
        >>> job.status()
        <Status.Partial: 3>

        The escrow contract is in Paid state after the second payout and it can't be cancelled.

        >>> payouts = [("0x852023fbb19050B8291a335E5A83Ac9701E7B4E6", Decimal('80.0'))]
        >>> job.bulk_payout(payouts, {'results': 0}, rep_oracle_pub_key)
        True
        >>> job.cancel()
        False
        >>> job.status()
        <Status.Paid: 4>

        Returns:
            bool: returns True if gas payer has been paid back and contract is in "Cancelled" state.

        """
        txn_event = "Job cancellation"
        txn_func = self.job_contract.functions.cancel
        txn_info = {
            "gas_payer": self.gas_payer,
            "gas_payer_priv": self.gas_payer_priv,
            "gas": self.gas,
            "hmt_server_addr": self.hmt_server_addr,
        }

        try:
            handle_transaction_with_retry(txn_func, self.retry, *[], **txn_info)
            return self.status() == Status.Cancelled
        except Exception as e:
            LOG.info(
                f"{txn_event} failed with main credentials: {self.gas_payer}, {self.gas_payer_priv} due to {e}. Using secondary ones..."
            )

        raffle_txn_res = self._raffle_txn(
            self.multi_credentials, txn_func, [], txn_event
        )
        job_cancelled = raffle_txn_res["txn_succeeded"]

        if not job_cancelled:
            LOG.exception(f"{txn_event} failed with all credentials.")

        return self.status() == Status.Cancelled

    def store_intermediate_results(self, results: Dict, pub_key: bytes) -> bool:
        """Recording Oracle stores intermediate results with Reputation Oracle's public key to S3
        and updates the contract's state.

        >>> from test.human_protocol_sdk.utils import manifest
        >>> credentials = {
        ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> rep_oracle_pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"
        >>> job = Job(credentials, manifest)
        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.setup()
        True

        Storing intermediate results uploads and updates results url correctly.

        >>> results = {"results": True}
        >>> job.store_intermediate_results(results, rep_oracle_pub_key)
        True
        >>> rep_oracle_priv_key = b"ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        >>> job.intermediate_results(rep_oracle_priv_key)
        {'results': True}

        >>> multi_credentials = [("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"), ("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a")]
        >>> job = Job(credentials, manifest, multi_credentials=multi_credentials)
        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.setup()
        True
        >>> job.store_intermediate_results(results, rep_oracle_pub_key)
        True

        >>> multi_credentials = [("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"), ("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a")]
        >>> job = Job(credentials, manifest, multi_credentials=multi_credentials)
        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.setup()
        True
        >>> results = {"results": False}

        Inject wrong credentials on purpose to test out raffling

        >>> job.gas_payer_priv = "657b6497a355a3982928d5515d48a84870f057c4d16923eb1d104c0afada9aa8"
        >>> job.multi_credentials = [("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"), ("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d")]
        >>> job.store_intermediate_results(results, rep_oracle_pub_key)
        False

        Args:
            results (Dict): intermediate results of the Recording Oracle.
            pub_key (bytes): public key of the Reputation Oracle.

        Returns:
            returns True if contract's state is updated and IPFS upload succeeds.

        """
        txn_event = "Storing intermediate results"
        txn_func = self.job_contract.functions.storeResults
        txn_info = {
            "gas_payer": self.gas_payer,
            "gas_payer_priv": self.gas_payer_priv,
            "gas": self.gas,
            "hmt_server_addr": self.hmt_server_addr,
        }
        (hash_, url) = upload(results, pub_key)

        self.intermediate_manifest_hash = hash_
        self.intermediate_manifest_url = url

        func_args = [url, hash_]

        try:
            handle_transaction_with_retry(txn_func, self.retry, *func_args, **txn_info)
            return True
        except Exception as e:
            LOG.info(
                f"{txn_event} failed with main credentials: {self.gas_payer}, {self.gas_payer_priv} due to {e}. Using secondary ones..."
            )

        raffle_txn_res = self._raffle_txn(
            self.multi_credentials, txn_func, func_args, txn_event
        )
        results_stored = raffle_txn_res["txn_succeeded"]

        if not results_stored:
            LOG.exception(f"{txn_event} failed with all credentials.")
            del self.intermediate_manifest_hash
            del self.intermediate_manifest_url

        return results_stored

    def complete(
        self, blocking: bool = False, retries: int = 3, delay: int = 5, backoff: int = 2
    ) -> bool:
        """Completes the Job if it has been paid.

        >>> from test.human_protocol_sdk.utils import manifest
        >>> credentials = {
        ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> rep_oracle_pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"
        >>> job = Job(credentials, manifest)
        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.setup()
        True
        >>> payouts = [("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", Decimal('20.0'))]
        >>> job.bulk_payout(payouts, {}, rep_oracle_pub_key)
        True

        A Job can't be completed when it is still in partially paid state.

        >>> job.status()
        <Status.Partial: 3>
        >>> job.complete()
        False

        Job completes in paid state correctly.

        >>> payouts = [("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", Decimal('80.0'))]
        >>> job.bulk_payout(payouts, {}, rep_oracle_pub_key)
        True
        >>> job.complete()
        True
        >>> job.status()
        <Status.Complete: 5>

        Returns:
            bool: returns True if the contract has been completed.

        """
        txn_event = "Job completion"
        txn_func = self.job_contract.functions.complete
        txn_info = {
            "gas_payer": self.gas_payer,
            "gas_payer_priv": self.gas_payer_priv,
            "gas": self.gas,
            "hmt_server_addr": self.hmt_server_addr,
        }

        try:
            handle_transaction_with_retry(txn_func, self.retry, *[], **txn_info)
            return self.status() == Status.Complete
        except Exception as e:
            LOG.info(
                f"{txn_event} failed with main credentials: {self.gas_payer}, {self.gas_payer_priv} due to {e}. Using secondary ones..."
            )

        raffle_txn_res = self._raffle_txn(
            self.multi_credentials, txn_func, [], txn_event
        )
        job_completed = raffle_txn_res["txn_succeeded"]

        if not job_completed:
            LOG.exception(f"{txn_event} failed with all credentials.")

        return self.status() == Status.Complete

    def status(self) -> Enum:
        """Returns the status of the Job.

        >>> from test.human_protocol_sdk.utils import manifest
        >>> credentials = {
        ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> rep_oracle_pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"
        >>> job = Job(credentials, manifest)

        After deployment status is "Launched".

        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.status()
        <Status.Launched: 1>

        Returns:
            Enum: returns the status as an enumeration.

        """
        return status(self.job_contract, self.gas_payer, self.gas)

    def balance(self) -> int:
        """Retrieve the balance of a Job in HMT.

        >>> from test.human_protocol_sdk.utils import manifest
        >>> credentials = {
        ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> rep_oracle_pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"
        >>> job = Job(credentials, manifest)
        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.setup()
        True
        >>> job.balance()
        100000000000000000000

        Args:
            escrow_contract (Contract): the contract to be read.
            gas_payer (str): an ethereum address calling the contract.
            gas (int): maximum amount of gas the caller is ready to pay.

        Returns:
            int: returns the balance of the contract in HMT.

        """
        return self.job_contract.functions.getBalance().call(
            {"from": self.gas_payer, "gas": Wei(self.gas)}
        )

    def manifest(self, priv_key: bytes) -> Dict:
        """Retrieves the initial manifest used to setup a Job.

        >>> from test.human_protocol_sdk.utils import manifest
        >>> credentials = {
        ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> rep_oracle_pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"
        >>> job = Job(credentials, manifest)
        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.setup()
        True
        >>> rep_oracle_priv_key = b"ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        >>> manifest = job.manifest(rep_oracle_priv_key)
        >>> manifest_amount = int(int(manifest["job_total_tasks"]) * Decimal(manifest["task_bid_price"]))
        >>> manifest_amount == job.amount
        True

        Args:
            priv_key (bytes): the private key used to download the manifest.

        Returns:
            bool: returns True if IPFS download with the private key succeeds.

        """
        return download(self.manifest_url, priv_key)

    def intermediate_results(self, priv_key: bytes) -> Dict:
        """Reputation Oracle retrieves the intermediate results stored by the Recording Oracle.

        >>> from test.human_protocol_sdk.utils import manifest
        >>> credentials = {
        ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> rep_oracle_pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"
        >>> job = Job(credentials, manifest)
        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.setup()
        True

        Trying to download the results with the wrong key fails.

        >>> results = {"results": True}
        >>> job.store_intermediate_results(results, rep_oracle_pub_key)
        True
        >>> rep_oracle_false_priv_key = b"59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
        >>> job.intermediate_results(rep_oracle_false_priv_key)
        Traceback (most recent call last):
        human_protocol_sdk.crypto.exceptions.DecryptionError: Failed to verify tag

        Args:
            priv_key (bytes): the private key of the Reputation Oracle.

        Returns:
            bool: returns True if IPFS download with the private key succeeds.

        """
        return download(self.intermediate_manifest_url, priv_key)

    def final_results(self, priv_key: bytes) -> Optional[Dict]:
        """Retrieves the final results stored by the Reputation Oracle.

        >>> from test.human_protocol_sdk.utils import manifest
        >>> credentials = {
        ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> rep_oracle_pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"
        >>> job = Job(credentials, manifest)
        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.setup()
        True

        Getting final results succeeds after payout.

        >>> payouts = [("0x852023fbb19050B8291a335E5A83Ac9701E7B4E6", Decimal('100.0'))]
        >>> job.bulk_payout(payouts, {'results': 0}, rep_oracle_pub_key)
        True
        >>> rep_oracle_priv_key = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        >>> job.final_results(rep_oracle_priv_key)
        {'results': 0}

        Args:
            priv_key (bytes): the private key of the the job requester or their agent.

        Returns:
            bool: returns True if IPFS download with the private key succeeds.

        """
        final_results_url = self.job_contract.functions.finalResultsUrl().call(
            {"from": self.gas_payer, "gas": Wei(self.gas)}
        )

        if not final_results_url:
            return None

        url = get_key_from_url(final_results_url)

        return download(url, priv_key)

    def _access_job(self, factory_addr: str, escrow_addr: str, **credentials):
        """Given a factory and escrow address and credentials, access an already
        launched manifest of an already deployed escrow contract.

        Args:
            factory_addr (str): an ethereum address of the escrow factory contract.
            escrow_addr (str): an ethereum address of the escrow contract.
            **credentials: an unpacked dict of an ethereum address and its private key.

        """
        gas_payer = credentials["gas_payer"]
        rep_oracle_priv_key = credentials["rep_oracle_priv_key"]

        self.factory_contract = get_factory(factory_addr, self.hmt_server_addr)
        self.job_contract = get_escrow(escrow_addr, self.hmt_server_addr)
        self.manifest_url = manifest_url(self.job_contract, gas_payer, self.gas)
        self.manifest_hash = manifest_hash(self.job_contract, gas_payer, self.gas)

        manifest_dict = self.manifest(rep_oracle_priv_key)
        escrow_manifest = Manifest(manifest_dict)
        self._init_job(escrow_manifest)

    def _init_job(self, manifest: Manifest):
        """Initialize a Job's class attributes with a given manifest.

        Args:
            manifest (Manifest): a dict representation of the Manifest model.

        """
        serialized_manifest = dict(manifest.serialize())
        per_job_cost = Decimal(serialized_manifest["task_bid_price"])
        number_of_answers = int(serialized_manifest["job_total_tasks"])
        self.serialized_manifest = serialized_manifest
        self.amount = Decimal(per_job_cost * number_of_answers)

    def _eth_addr_valid(self, addr, priv_key):
        priv_key_bytes = decode_hex(priv_key)
        pub_key = keys.PrivateKey(priv_key_bytes).public_key
        calculated_addr = pub_key.to_checksum_address()
        return Web3.toChecksumAddress(addr) == calculated_addr

    def _validate_multi_credentials(
        self, multi_credentials: List[Tuple]
    ) -> List[Tuple[Any, Any]]:
        """Validates whether the given ethereum private key maps to the address
        by calculating the checksum address from the private key and comparing that
        to the given address.

        >>> from test.human_protocol_sdk.utils import manifest
        >>> credentials = {
        ...     "gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> valid_multi_credentials = [("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"), ("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d")]
        >>> job = Job(credentials, manifest, multi_credentials=valid_multi_credentials)
        >>> job.multi_credentials
        [('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'), ('0x70997970C51812dc3A010C7d01b50e0d17dc79C8', '59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d')]

        >>> invalid_multi_credentials = [("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"), ("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")]
        >>> job = Job(credentials, manifest, multi_credentials=invalid_multi_credentials)
        >>> job.multi_credentials
        [('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80')]

        Args:
            multi_credentials (List[Tuple]): a list of tuples with ethereum address, private key pairs.

        Returns:
            List (List[Tuple]): returns a list of tuples with ethereum address, private key pairs that are valid.

        """
        valid_credentials = []
        for gas_payer, gas_payer_priv in multi_credentials:
            credentials_valid = self._eth_addr_valid(gas_payer, gas_payer_priv)
            if not credentials_valid:
                LOG.warning(
                    f"Ethereum address {gas_payer} doesn't match private key {gas_payer_priv}"
                )
                continue
            valid_credentials.append((gas_payer, gas_payer_priv))
        return valid_credentials

    def _validate_credentials(
        self, multi_credentials: List[Tuple], **credentials
    ) -> bool:
        """Validates whether the given ethereum private key maps to the address
        by calculating the checksum address from the private key and comparing that
        to the given address.

        Validating right credentials succeeds.
        >>> from test.human_protocol_sdk.utils import manifest
        >>> credentials = {
        ...     "gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> job = Job(credentials, manifest)

        >>> multi_credentials = [("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"), ("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")]
        >>> job = Job(credentials, manifest, multi_credentials=multi_credentials)

        Validating falsy credentials fails.
        >>> credentials = {
        ...     "gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
        ... }
        >>> job = Job(credentials, manifest)
        Traceback (most recent call last):
        ValueError: Given private key doesn't match the ethereum address.

        Args:
            multi_credentials (List[Tuple]): a list of tuples with ethereum address, private key pairs.
            **credentials: an unpacked dict of an ethereum address and its private key.

        Returns:
            bool: returns True if the calculated and the given address match.

        """
        gas_payer_addr = credentials["gas_payer"]
        gas_payer_priv = credentials["gas_payer_priv"]

        return self._eth_addr_valid(gas_payer_addr, gas_payer_priv)

    def _factory_contains_escrow(self, escrow_addr: str, factory_addr: str) -> bool:
        """Checks whether a given factory address contains a given escrow address.

        >>> from test.human_protocol_sdk.utils import manifest
        >>> credentials = {
        ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        ...     "rep_oracle_priv_key": b"ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> rep_oracle_pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"
        >>> job = Job(credentials, manifest)
        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.setup()
        True

        Factory contains the escrow address.
        >>> factory_addr = job.factory_contract.address
        >>> escrow_addr = job.job_contract.address
        >>> new_job = Job(credentials=credentials, factory_addr=factory_addr, escrow_addr=escrow_addr)
        >>> new_job._factory_contains_escrow(escrow_addr, factory_addr)
        True

        Args:
            factory_addr (str): an ethereum address of the escrow factory contract.
            escrow_addr (str): an ethereum address of the escrow contract.
            gas_payer (str): an ethereum address calling the contract.
            gas (int): maximum amount of gas the caller is ready to pay.

        Returns:
            bool: returns True escrow belongs to the factory.

        """
        factory_contract = get_factory(
            factory_addr, hmt_server_addr=self.hmt_server_addr
        )
        return factory_contract.functions.hasEscrow(escrow_addr).call(
            {"from": self.gas_payer, "gas": Wei(self.gas)}
        )

    def _init_factory(
        self, factory_addr: Optional[str], credentials: Dict[str, str]
    ) -> Contract:
        """Takes an optional factory address and returns its contract representation. Alternatively
        a new factory is created.

        Initializing a new Job instance without a factory address succeeds.
        >>> from test.human_protocol_sdk.utils import manifest
        >>> credentials = {
        ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> job = Job(credentials, manifest)
        >>> type(job.factory_contract)
        <class 'web3._utils.datatypes.Contract'>

        Initializing a new Job instance with a factory address succeeds.
        >>> factory_addr = deploy_factory(**credentials)
        >>> job = Job(credentials, manifest, factory_addr)
        >>> job.factory_contract.address == factory_addr
        True

        Args:
            credentials (Dict[str, str]): a dict of an ethereum address and its private key.
            factory_addr (Optional[str]): an ethereum address of the escrow factory contract.
            gas (int): maximum amount of gas the caller is ready to pay.

        Returns:
            bool: returns a factory contract.

        """
        factory_addr_valid = Web3.isChecksumAddress(factory_addr)
        factory = None

        if not factory_addr_valid:
            factory_addr = deploy_factory(
                gas=self.gas, hmt_server_addr=self.hmt_server_addr, **credentials
            )
            factory = get_factory(factory_addr, hmt_server_addr=self.hmt_server_addr)
            if not factory_addr:
                raise Exception("Unable to get address from factory")

        if not factory:
            factory = get_factory(
                str(factory_addr), hmt_server_addr=self.hmt_server_addr
            )

        return factory

    def _bulk_paid(self) -> int:
        """Checks if the last bulk payment has succeeded.

        >>> from test.human_protocol_sdk.utils import manifest
        >>> credentials = {
        ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> rep_oracle_pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"
        >>> job = Job(credentials, manifest)
        >>> job.launch(rep_oracle_pub_key)
        True
        >>> job.setup()
        True

        No payout has been performed yet.
        >>> job._bulk_paid()
        False

        Bulk has been paid upon successful bulk payout.
        >>> payouts = [("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", Decimal('20.0')), ("0x852023fbb19050B8291a335E5A83Ac9701E7B4E6", Decimal('50.0'))]
        >>> job.bulk_payout(payouts, {}, rep_oracle_pub_key)
        True
        >>> job._bulk_paid()
        True

        Args:
            gas (int): maximum amount of gas the caller is ready to pay.

        Returns:
            returns True if the last bulk payout has succeeded.

        """
        return self.job_contract.functions.bulkPaid().call(
            {"from": self.gas_payer, "gas": Wei(self.gas)}
        )

    def _create_escrow(self, trusted_handlers=[]) -> RaffleTxn:
        """Launches a new escrow contract to the ethereum network.

        >>> from test.human_protocol_sdk.utils import manifest
        >>> multi_credentials = [("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"), ("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a")]
        >>> trusted_handlers = [addr for addr, priv_key in multi_credentials]
        >>> credentials = {
        ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ... }
        >>> job = Job(credentials, manifest)
        >>> txn = job._create_escrow(trusted_handlers)
        >>> txn["txn_succeeded"]
        True

        >>> job = Job(credentials, manifest, multi_credentials=multi_credentials)

        Inject wrong credentials on purpose to test out raffling
        >>> job.gas_payer_priv = "657b6497a355a3982928d5515d48a84870f057c4d16923eb1d104c0afada9aa8"
        >>> job.multi_credentials = [("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"), ("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d")]
        >>> txn = job._create_escrow(trusted_handlers)
        >>> txn["txn_succeeded"]
        False

        Args:
            gas (int): maximum amount of gas the caller is ready to pay.

        Returns:
            bool: returns True if a new job was successfully launched to the network.

        Raises:
            TimeoutError: if wait_on_transaction times out.

        """
        txn_event = "Contract creation"
        txn_func = self.factory_contract.functions.createEscrow
        txn_info = {
            "gas_payer": self.gas_payer,
            "gas_payer_priv": self.gas_payer_priv,
            "gas": self.gas,
            "hmt_server_addr": self.hmt_server_addr,
        }
        func_args = [trusted_handlers]

        try:
            tx_receipt = handle_transaction_with_retry(
                txn_func, self.retry, *func_args, **txn_info
            )
            return {"txn_succeeded": True, "tx_receipt": tx_receipt}
        except Exception as e:
            LOG.info(
                f"{txn_event} failed with main credentials: {self.gas_payer}, {self.gas_payer_priv} due to {e}. Using secondary ones..."
            )

        raffle_txn_res = self._raffle_txn(
            self.multi_credentials, txn_func, func_args, txn_event
        )

        if not raffle_txn_res["txn_succeeded"]:
            LOG.exception(f"{txn_event} failed with all credentials.")

        return raffle_txn_res

    def _raffle_txn(self, multi_creds, txn_func, txn_args, txn_event) -> RaffleTxn:
        """Takes in multiple credentials, loops through each and performs the given transaction.

        Args:
            credentials (Dict[str, str]): a dict of multiple ethereum addresses and their private keys.
            txn_func: the transaction function to be handled.
            txn_args (List): the arguments the transaction takes.
            txn_event (str): the transaction event that will be performed.
            gas (int): maximum amount of gas the caller is ready to pay.

        Returns:
            bool: returns True if the given transaction succeeds.

        """
        txn_succeeded = False
        tx_receipt = None

        for gas_payer, gas_payer_priv in multi_creds:
            txn_info = {
                "gas_payer": gas_payer,
                "gas_payer_priv": gas_payer_priv,
                "gas": self.gas,
                "hmt_server_addr": self.hmt_server_addr,
            }
            try:
                tx_receipt = handle_transaction_with_retry(
                    txn_func, self.retry, *txn_args, **txn_info
                )
                self.gas_payer = gas_payer
                self.gas_payer_priv = gas_payer_priv
                txn_succeeded = True
                break
            except Exception as e:
                LOG.debug(
                    f"{txn_event} failed with {gas_payer} and {gas_payer_priv} due to {e}."
                )

        return {"txn_succeeded": txn_succeeded, "tx_receipt": tx_receipt}

    def _check_transfer_event(self, tx_receipt: Optional[TxReceipt]) -> bool:
        """
        Check if transaction receipt has bulkTransfer event, to make sure that transaction was successful.

        Args:
            tx_receipt (Optional[TxReceipt]): a dict with transaction receipt.

        Returns:
            bool: returns True if transaction has bulkTransfer event, otherwise returns False.
        """
        if not tx_receipt:
            return False

        for log in tx_receipt.get("logs", {}):
            for topic in log["topics"]:
                if TRANSFER_EVENT == topic:
                    return True
        return False
