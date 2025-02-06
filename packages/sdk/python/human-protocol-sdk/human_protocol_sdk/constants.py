from enum import Enum
import os


class ChainId(Enum):
    """Enum for chain IDs."""

    MAINNET = 1
    SEPOLIA = 11155111
    BSC_MAINNET = 56
    BSC_TESTNET = 97
    POLYGON = 137
    POLYGON_AMOY = 80002
    LOCALHOST = 1338


class OrderDirection(Enum):
    """Enum for chain IDs."""

    ASC = "asc"
    DESC = "desc"


class LeaderCategory(Enum):
    """Enum for leader categories"""

    MACHINE_LEARNING = "machine_learning"
    MARKET_MAKING = "market_making"


NETWORKS = {
    ChainId.MAINNET: {
        "title": "Ethereum",
        "scan_url": "https://etherscan.io",
        "subgraph_url": (
            "https://api.studio.thegraph.com/query/74256/ethereum/version/latest"
        ),
        "subgraph_url_api_key": (
            "https://gateway-arbitrum.network.thegraph.com/api/[SUBGRAPH_API_KEY]/deployments/id/Qmc8ikCj9y2uvYGTeELkM9wybPdcD2PgpW4tjJMwnogLrq"
        ),
        "hmt_address": "0xd1ba9BAC957322D6e8c07a160a3A8dA11A0d2867",
        "factory_address": "0xD9c75a1Aa4237BB72a41E5E26bd8384f10c1f55a",
        "staking_address": "0xEf6Da3aB52c33925Be3F84038193a7e1331F51E6",
        "kvstore_address": "0xB6d36B1CDaD50302BCB3DB43bAb0D349458e1b8D",
        "old_subgraph_url": "",
        "old_factory_address": "",
    },
    ChainId.SEPOLIA: {
        "title": "Sepolia",
        "scan_url": "https://sepolia.etherscan.io",
        "subgraph_url": (
            "https://api.studio.thegraph.com/query/74256/sepolia/version/latest"
        ),
        "subgraph_url_api_key": (
            "https://gateway-arbitrum.network.thegraph.com/api/[SUBGRAPH_API_KEY]/deployments/id/QmfB1oqYCMTKZB2vcYJzQmGGvVS8cMCHohpYbjKFWoFo8z"
        ),
        "hmt_address": "0x792abbcC99c01dbDec49c9fa9A828a186Da45C33",
        "factory_address": "0x5987A5558d961ee674efe4A8c8eB7B1b5495D3bf",
        "staking_address": "0x2163e3A40032Af1C359ac731deaB48258b317890",
        "kvstore_address": "0xCc0AF0635aa19fE799B6aFDBe28fcFAeA7f00a60",
        "old_subgraph_url": (""),
        "old_factory_address": "0x98108c28B7767a52BE38B4860832dd4e11A7ecad",
    },
    ChainId.BSC_MAINNET: {
        "title": "Binance Smart Chain",
        "scan_url": "https://bscscan.com",
        "subgraph_url": (
            "https://api.studio.thegraph.com/query/74256/bsc/version/latest"
        ),
        "subgraph_url_api_key": (
            "hthttps://gateway-arbitrum.network.thegraph.com/api/[SUBGRAPH_API_KEY]/deployments/id/QmPEaCSuzbVHDrGEWTS7T4N8U7kBMMMfkj4b4ZeqheVuMc"
        ),
        "hmt_address": "0x711Fd6ab6d65A98904522d4e3586F492B989c527",
        "factory_address": "0x92FD968AcBd521c232f5fB8c33b342923cC72714",
        "staking_address": "0xE24e5C08E28331D24758b69A5E9f383D2bDD1c98",
        "kvstore_address": "0x21A0C4CED7aE447fCf87D9FE3A29FA9B3AB20Ff1",
        "old_subgraph_url": "https://api.thegraph.com/subgraphs/name/humanprotocol/bsc",
        "old_factory_address": "0xc88bC422cAAb2ac8812de03176402dbcA09533f4",
    },
    ChainId.BSC_TESTNET: {
        "title": "Binance Smart Chain (Testnet)",
        "scan_url": "https://testnet.bscscan.com",
        "subgraph_url": (
            "https://api.studio.thegraph.com/query/74256/bsc-testnet/version/latest"
        ),
        "subgraph_url_api_key": (
            "https://gateway-arbitrum.network.thegraph.com/api/[SUBGRAPH_API_KEY]/deployments/id/Qmbp8jzcYurrKdk1Mg5ycJ8jcxwou3wWsmNcRdAc16aQEt"
        ),
        "hmt_address": "0xE3D74BBFa45B4bCa69FF28891fBE392f4B4d4e4d",
        "factory_address": "0x2bfA592DBDaF434DDcbb893B1916120d181DAD18",
        "staking_address": "0xD6D347ba6987519B4e42EcED43dF98eFf5465a23",
        "kvstore_address": "0x32e27177BA6Ea91cf28dfd91a0Da9822A4b74EcF",
        "old_subgraph_url": (
            "https://api.thegraph.com/subgraphs/name/humanprotocol/bsctest"
        ),
        "old_factory_address": "0xaae6a2646c1f88763e62e0cd08ad050ea66ac46f",
    },
    ChainId.POLYGON: {
        "title": "Polygon",
        "scan_url": "https://polygonscan.com",
        "subgraph_url": (
            "https://api.studio.thegraph.com/query/74256/polygon/version/latest"
        ),
        "subgraph_url_api_key": (
            "https://gateway-arbitrum.network.thegraph.com/api/[SUBGRAPH_API_KEY]/deployments/id/QmeSoEuFieiKXtqzDY3WUBz5gKFWwYVPP7iaebpBpJyo7Y"
        ),
        "hmt_address": "0xc748B2A084F8eFc47E086ccdDD9b7e67aEb571BF",
        "factory_address": "0xBDBfD2cC708199C5640C6ECdf3B0F4A4C67AdfcB",
        "staking_address": "0x01D115E9E8bF0C58318793624CC662a030D07F1D",
        "kvstore_address": "0xbcB28672F826a50B03EE91B28145EAbddA73B2eD",
        "old_subgraph_url": (
            "https://api.thegraph.com/subgraphs/name/humanprotocol/polygon"
        ),
        "old_factory_address": "0x45eBc3eAE6DA485097054ae10BA1A0f8e8c7f794",
    },
    ChainId.POLYGON_AMOY: {
        "title": "Polygon Amoy",
        "scan_url": "https://amoy.polygonscan.com",
        "subgraph_url": (
            "https://api.studio.thegraph.com/query/74256/amoy/version/latest"
        ),
        "subgraph_url_api_key": (
            "https://gateway-arbitrum.network.thegraph.com/api/[SUBGRAPH_API_KEY]/deployments/id/QmQUUv8SK2skarDrJpB8LXXqMwjzxg3Z42dx12uEL5Pmeq"
        ),
        "hmt_address": "0x792abbcC99c01dbDec49c9fa9A828a186Da45C33",
        "factory_address": "0xAFf5a986A530ff839d49325A5dF69F96627E8D29",
        "staking_address": "0xffE496683F842a923110415b7278ded3F265f2C5",
        "kvstore_address": "0x724AeFC243EdacCA27EAB86D3ec5a76Af4436Fc7",
        "old_subgraph_url": "",
        "old_factory_address": "",
    },
    ChainId.LOCALHOST: {
        "title": "Localhost",
        "scan_url": "",
        "subgraph_url": "http://localhost:8000/subgraphs/name/humanprotocol/localhost",
        "subgraph_url_api_key": "",
        "hmt_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        "factory_address": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        "staking_address": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        "kvstore_address": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
        "old_subgraph_url": "",
        "old_factory_address": "",
    },
}


SUBGRAPH_API_KEY_PLACEHOLDER = "[SUBGRAPH_API_KEY]"


class Status(Enum):
    """Enum for escrow statuses."""

    Launched = 0
    Pending = 1
    Partial = 2
    Paid = 3
    Complete = 4
    Cancelled = 5


class Role(Enum):
    """Enum for roles."""

    job_launcher = "Job Launcher"
    exchange_oracle = "Exchange Oracle"
    reputation_oracle = "Reputation Oracle"
    recording_oracle = "Recording Oracle"


ARTIFACTS_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "artifacts")


class KVStoreKeys(Enum):
    """Enum for KVStore keys"""

    category = "category"
    fee = "fee"
    job_types = "job_types"
    operator_name = "name"
    public_key = "public_key"
    public_key_hash = "public_key_hash"
    registration_instructions = "registration_instructions"
    registration_needed = "registration_needed"
    role = "role"
    url = "url"
    website = "website"
    webhook_url = "webhook_url"


ESCROW_BULK_PAYOUT_MAX_ITEMS = 99
