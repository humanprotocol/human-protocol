import json
import logging
import os
from time import sleep
from typing import Dict, Any

from eth_typing import ChecksumAddress, HexAddress, HexStr, URI
from web3 import Web3
from web3._utils.transactions import wait_for_transaction_receipt
from web3.contract import Contract
from web3.middleware import geth_poa_middleware
from web3.providers.auto import load_provider_from_uri
from web3.providers.eth_tester import EthereumTesterProvider
from web3.types import TxReceipt

AttributeDict = Dict[str, Any]

GAS_LIMIT = int(os.getenv("GAS_LIMIT", 4712388))

LOG = logging.getLogger("human_protocol_sdk.eth_bridge")
HMTOKEN_ADDR = Web3.toChecksumAddress(
    os.getenv("HMTOKEN_ADDR", "0x5FbDB2315678afecb367f032d93F642f64180aa3")
)

ABIS_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "contracts")

# See more details about the eth-kvstore here: https://github.com/hCaptcha/eth-kvstore
KVSTORE_CONTRACT = Web3.toChecksumAddress(
    os.getenv("KVSTORE_CONTRACT", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0")
)
WEB3_POLL_LATENCY = float(os.getenv("WEB3_POLL_LATENCY", 5))
WEB3_TIMEOUT = int(os.getenv("WEB3_TIMEOUT", 240))


class Retry(object):
    """Retry class holding retry parameters"""

    def __init__(self, retries=0, delay=5, backoff=2):
        """Inits

        Args:
            retries: number of retries
            delay: seconds to wait between retries
            backoff: exponent to increment delay between calls (1 linear, 2 quadratic)
        """
        self.retries = retries
        self.delay = delay
        self.backoff = backoff


def get_w3(hmt_server_addr: str = None) -> Web3:
    """Set up the web3 provider for serving transactions to the ethereum network.

    >>> w3 = get_w3()
    >>> type(w3)
    <class 'web3.main.Web3'>
    >>> type(w3.provider)
    <class 'web3.providers.rpc.HTTPProvider'>

    >>> os.environ["HMT_ETH_SERVER"] = "wss://localhost:8546"
    >>> w3 = get_w3()
    >>> type(w3)
    <class 'web3.main.Web3'>
    >>> type(w3.provider)
    <class 'web3.providers.websocket.WebsocketProvider'>
    >>> del os.environ["HMT_ETH_SERVER"]

    Args:
        hmt_server_addr: infura API address.

    Returns:
        Web3: returns the web3 provider.

    """
    endpoint = None

    if hmt_server_addr:
        endpoint = hmt_server_addr

    if not endpoint:
        endpoint = os.getenv("HMT_ETH_SERVER", "http://localhost:8545")

    if not endpoint:
        LOG.error("Using EthereumTesterProvider as we have no HMT_ETH_SERVER")

    provider = (
        load_provider_from_uri(URI(endpoint)) if endpoint else EthereumTesterProvider()
    )

    w3 = Web3(provider)
    w3.middleware_onion.inject(geth_poa_middleware, layer=0)
    return w3


def handle_transaction(txn_func, *args, **kwargs) -> TxReceipt:
    """Handles a transaction that updates the contract state by locally
    signing, building, sending the transaction and returning a transaction
    receipt.

    Args:
        txn_func: the transaction function to be handled.

        \*args: all the arguments the function takes.

        \*\*kwargs: the transaction data used to complete the transaction.

    Returns:
        AttributeDict: returns the transaction receipt.

    Raises:
        TimeoutError: if waiting for the transaction receipt times out.
    """
    gas_payer = kwargs["gas_payer"]
    gas_payer_priv = kwargs["gas_payer_priv"]
    gas = kwargs["gas"]
    hmt_server_addr = kwargs.get("hmt_server_addr")

    w3 = get_w3(hmt_server_addr)
    nonce = w3.eth.getTransactionCount(gas_payer)

    txn_dict = txn_func(*args).buildTransaction(
        {"from": gas_payer, "gas": gas, "nonce": nonce}
    )

    signed_txn = w3.eth.account.signTransaction(txn_dict, private_key=gas_payer_priv)
    txn_hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)

    try:
        txn_receipt = wait_for_transaction_receipt(
            w3, txn_hash, timeout=WEB3_TIMEOUT, poll_latency=WEB3_POLL_LATENCY
        )
    except TimeoutError as e:
        raise e
    return txn_receipt


def handle_transaction_with_retry(
    txn_func, retry=Retry(), *args, **kwargs
) -> TxReceipt:
    """Handle transaction

    Same as ``handle_transaction`` but with retry and backoff

    Args:
        txn_func: the transaction function to be handled.

        retry: Retry object containing retrying parameters.

        \*args: all the arguments the function takes.

        \*\*kwargs: the transaction data used to complete the transaction.

    Returns:
        AttributeDict: returns the transaction receipt.

    """

    wait_time = retry.delay

    for i in range(retry.retries + 1):
        try:
            return handle_transaction(txn_func, *args, **kwargs)
        except Exception as e:
            if i == retry.retries:
                LOG.debug(f"giving up on transaction after {i} retries")
                raise e
            else:
                LOG.debug(
                    f"(x{i + 1}) handle_transaction: {e}. Retrying after {wait_time} sec..."
                )
                sleep(wait_time)
                wait_time *= retry.backoff

    raise Exception("give up on handle_transaction")


def get_contract_interface(contract_entrypoint):
    """Retrieve the contract interface of a given contract.

    Args:
        contract_entrypoint: the entrypoint of the JSON.

    Returns:
        returns the contract interface containing the contract abi.

    """
    with open(contract_entrypoint) as f:
        contract_interface = json.load(f)
    return contract_interface


def get_hmtoken_interface():
    """Retrieve the HMToken interface.

    Returns:
        Contract interface: returns the HMToken interface solidity contract.

    """

    return get_contract_interface(
        "{}/HMTokenInterface.sol/HMTokenInterface.json".format(ABIS_FOLDER)
    )


def get_hmtoken(hmtoken_addr=HMTOKEN_ADDR, hmt_server_addr: str = None) -> Contract:
    """Retrieve the HMToken contract from a given address.

    >>> type(get_hmtoken())
    <class 'web3._utils.datatypes.Contract'>

    Args:
        hmt_server_addr (str): infura API address.

    Returns:
        Contract: returns the HMToken solidity contract.

    """
    w3 = get_w3(hmt_server_addr)
    contract_interface = get_hmtoken_interface()
    contract = w3.eth.contract(address=hmtoken_addr, abi=contract_interface["abi"])
    return contract


def get_escrow(escrow_addr: str, hmt_server_addr: str = None) -> Contract:
    """Retrieve the Escrow contract from a given address.

    >>> from human_protocol_sdk.job import Job
    >>> from test.human_protocol_sdk.utils import manifest
    >>> credentials = {
    ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    ... }
    >>> rep_oracle_pub_key = b"2dbc2c2c86052702e7c219339514b2e8bd4687ba1236c478ad41b43330b08488c12c8c1797aa181f3a4596a1bd8a0c18344ea44d6655f61fa73e56e743f79e0d"
    >>> job = Job(credentials=credentials, escrow_manifest=manifest)

    Deploying a new Job to the ethereum network succeeds.

    >>> job.launch(rep_oracle_pub_key)
    True
    >>> type(get_escrow(job.job_contract.address))
    <class 'web3._utils.datatypes.Contract'>

    Args:
        escrow_addr (str): an ethereum address of the escrow contract.

        hmt_server_addr (str): infura API address.

    Returns:
        Contract: returns the Escrow solidity contract.

    """

    w3 = get_w3(hmt_server_addr)
    contract_interface = get_contract_interface(
        "{}/Escrow.sol/Escrow.json".format(ABIS_FOLDER)
    )
    escrow = w3.eth.contract(
        address=ChecksumAddress(HexAddress(HexStr(escrow_addr))),
        abi=contract_interface["abi"],
    )
    return escrow


def get_factory(factory_addr: str, hmt_server_addr: str = None) -> Contract:
    """Retrieve the EscrowFactory contract from a given address.

    >>> from human_protocol_sdk.job import Job
    >>> from test.human_protocol_sdk.utils import manifest
    >>> credentials = {
    ... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    ... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    ... }
    >>> job = Job(credentials=credentials, escrow_manifest=manifest)
    >>> type(get_factory(job.factory_contract.address))
    <class 'web3._utils.datatypes.Contract'>

    Args:
        factory_addr (str): the ethereum address of the Escrow contract.

        hmt_server_addr (str): infura API address.

    Returns:
        Contract: returns the EscrowFactory solidity contract.

    """
    w3 = get_w3(hmt_server_addr)
    contract_interface = get_contract_interface(
        "{}/EscrowFactory.sol/EscrowFactory.json".format(ABIS_FOLDER)
    )
    escrow_factory = w3.eth.contract(
        address=ChecksumAddress(HexAddress(HexStr(factory_addr))),
        abi=contract_interface["abi"],
    )
    return escrow_factory


def deploy_factory(
    gas: int = GAS_LIMIT,
    hmt_server_addr: str = None,
    hmtoken_addr: str = None,
    **credentials,
) -> str:
    """Deploy an EscrowFactory solidity contract to the ethereum network.

    Args:
        gas (int): maximum amount of gas the caller is ready to pay.

        hmt_server_addr (str): infura API address.

    Returns
        str: returns the contract address of the newly deployed factory.

    """
    if gas is None:
        gas = GAS_LIMIT
    gas_payer = credentials["gas_payer"]
    gas_payer_priv = credentials["gas_payer_priv"]
    hmtoken_address = HMTOKEN_ADDR if hmtoken_addr is None else hmtoken_addr

    w3 = get_w3(hmt_server_addr)
    contract_interface = get_contract_interface(
        "{}/EscrowFactory.sol/EscrowFactory.json".format(ABIS_FOLDER)
    )
    factory = w3.eth.contract(
        abi=contract_interface["abi"], bytecode=contract_interface["bytecode"]
    )

    txn_func = factory.constructor
    func_args = [hmtoken_address]
    txn_info = {
        "gas_payer": gas_payer,
        "gas_payer_priv": gas_payer_priv,
        "gas": gas,
        "hmt_server_addr": hmt_server_addr,
    }
    txn_receipt = handle_transaction(txn_func, *func_args, **txn_info)
    contract_addr = txn_receipt["contractAddress"]
    return str(contract_addr)


def deploy_staking(
    gas: int = GAS_LIMIT,
    hmt_server_addr: str = None,
    hmtoken_addr: str = None,
    factory_addr: str = None,
    minimum_stake: int = 1,
    lock_period: int = 1,
    **credentials,
) -> str:
    """Deploy an EscrowFactory solidity contract to the ethereum network.

    Args:
        gas (int): maximum amount of gas the caller is ready to pay.

        hmt_server_addr (str): infura API address.

    Returns
        str: returns the contract address of the newly deployed factory.

    """
    if gas is None:
        gas = GAS_LIMIT
    gas_payer = credentials["gas_payer"]
    gas_payer_priv = credentials["gas_payer_priv"]
    hmtoken_address = HMTOKEN_ADDR if hmtoken_addr is None else hmtoken_addr

    w3 = get_w3(hmt_server_addr)
    contract_interface = get_contract_interface(
        "{}/Staking.sol/Staking.json".format(ABIS_FOLDER)
    )
    staking = w3.eth.contract(
        abi=contract_interface["abi"], bytecode=contract_interface["bytecode"]
    )

    txn_func = staking.constructor
    func_args = [hmtoken_address, factory_addr, minimum_stake, lock_period]
    txn_info = {
        "gas_payer": gas_payer,
        "gas_payer_priv": gas_payer_priv,
        "gas": gas,
        "hmt_server_addr": hmt_server_addr,
    }
    txn_receipt = handle_transaction(txn_func, *func_args, **txn_info)
    contract_addr = txn_receipt["contractAddress"]
    return str(contract_addr)


def get_pub_key_from_addr(wallet_addr: str, hmt_server_addr: str = None) -> bytes:
    """
    Given a wallet address, uses the kvstore to pull down the public key for a user
    in the hmt universe, defined by the kvstore key `hmt_pub_key`.  Works with the
    `set_pub_key_at_address` function.

    Requires that the `GAS_PAYER` environment variable be set to the
    address that will be paying for the transaction on the ethereum network

    Args:
        wallet_addr (string): address to get the public key of

        hmt_server_addr (str): infura API address.

    Returns:
        bytes: the public key in bytes form

    >>> import os
    >>> from web3 import Web3
    >>> get_pub_key_from_addr('badaddress')
    Traceback (most recent call last):
      File "/usr/lib/python3.6/doctest.py", line 1330, in __run
        compileflags, 1), test.globs)
      File "<doctest __main__.get_pub_key_from_addr[2]>", line 1, in <module>
        get_pub_key_from_addr('blah')
      File "human_protocol_sdk/eth_bridge.py", line 268, in get_pub_key_from_addr
        raise ValueError('environment variable GAS_PAYER required')
    ValueError: environment variable GAS_PAYER required
    >>> os.environ['GAS_PAYER'] = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    >>> os.environ['GAS_PAYER_PRIV'] = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    >>> pub_key = b"2dbc2c2c86052702e7c219339514b2e8bd4687ba1236c478ad41b43330b08488c12c8c1797aa181f3a4596a1bd8a0c18344ea44d6655f61fa73e56e743f79e0d"
    >>> set_pub_key_at_addr(pub_key)  #doctest: +ELLIPSIS
    AttributeDict({'transactionHash': ...})
    >>> get_pub_key_from_addr(os.environ['GAS_PAYER'])
    b'2dbc2c2c86052702e7c219339514b2e8bd4687ba1236c478ad41b43330b08488c12c8c1797aa181f3a4596a1bd8a0c18344ea44d6655f61fa73e56e743f79e0d'

    """
    # TODO: Should we try to get the checksum address here instead of assuming user will do that?
    GAS_PAYER = os.getenv("GAS_PAYER")

    if not GAS_PAYER:
        raise ValueError("environment variable GAS_PAYER required")

    w3 = get_w3(hmt_server_addr)
    contract_interface = get_contract_interface(
        "{}/KVStore.sol/KVStore.json".format(ABIS_FOLDER)
    )

    kvstore = w3.eth.contract(address=KVSTORE_CONTRACT, abi=contract_interface["abi"])
    addr_pub_key = kvstore.functions.get(GAS_PAYER, "hmt_pub_key").call(
        {"from": GAS_PAYER}
    )

    return bytes(addr_pub_key, encoding="utf-8")


def set_pub_key_at_addr(
    pub_key: str, hmt_server_addr: str = None, gas: int = GAS_LIMIT
) -> TxReceipt:
    """
    Given a public key, this function will use the eth-kvstore to reach out to the blockchain
    and set the key `hmt_pub_key` on the callers kvstore collection of values, equivalent to the
    argument passed in here.  This will be used by HMT to encrypt data for the receiver

    See more about kvstore here: https://github.com/hCaptcha/eth-kvstore

    Args:
        pub_key (string): RSA Public key for this user

        hmt_server_addr (str): infura API address.

    Returns:
        AttributeDict: receipt of the set transaction on the blockchain


    >>> from web3 import Web3
    >>> import os
    >>> os.environ['GAS_PAYER'] = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    >>> os.environ['GAS_PAYER_PRIV'] = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    >>> pub_key_to_set = b"2dbc2c2c86052702e7c219339514b2e8bd4687ba1236c478ad41b43330b08488c12c8c1797aa181f3a4596a1bd8a0c18344ea44d6655f61fa73e56e743f79e0d"
    >>> set_pub_key_at_addr(pub_key_to_set)  #doctest: +ELLIPSIS
    AttributeDict({'transactionHash': ...})

    """
    GAS_PAYER = os.getenv("GAS_PAYER")
    GAS_PAYER_PRIV = os.getenv("GAS_PAYER_PRIV")

    if gas is None:
        gas = GAS_LIMIT

    if not (GAS_PAYER or GAS_PAYER_PRIV):
        raise ValueError("environment variable GAS_PAYER AND GAS_PAYER_PRIV required")

    w3 = get_w3(hmt_server_addr)
    contract_interface = get_contract_interface(
        "{}/KVStore.sol/KVStore.json".format(ABIS_FOLDER)
    )

    kvstore = w3.eth.contract(address=KVSTORE_CONTRACT, abi=contract_interface["abi"])

    txn_func = kvstore.functions.set
    func_args = ["hmt_pub_key", pub_key]
    txn_info = {
        "gas_payer": GAS_PAYER,
        "gas_payer_priv": GAS_PAYER_PRIV,
        "gas": gas,
        "hmt_server_addr": hmt_server_addr,
    }

    return handle_transaction(txn_func, *func_args, **txn_info)


def get_entity_topic(contract_interface: Dict, name: str) -> str:
    """
    Args:
        contract_interface (Dict): contract inteface.

        name (str): event name to find in abi.

    Returns
        str: returns keccak_256 hash of event name with input parameters.
    """
    s = ""

    for entity in contract_interface["abi"]:
        event_name = entity.get("name")
        if event_name == name:
            s += event_name + "("
            inputs = entity.get("inputs", [])
            input_types = []
            for input in inputs:
                input_types.append(input.get("internalType"))
            s += ",".join(input_types) + ")"

    return Web3.keccak(text=s)
