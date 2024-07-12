from enum import Enum
import os


class ChainId(Enum):
    """Enum for chain IDs."""

    MAINNET = 1
    RINKEBY = 4
    GOERLI = 5
    BSC_MAINNET = 56
    BSC_TESTNET = 97
    POLYGON = 137
    POLYGON_MUMBAI = 80001
    MOONBEAM = 1284
    MOONBASE_ALPHA = 1287
    AVALANCHE_TESTNET = 43113
    AVALANCHE = 43114
    SKALE = 1273227453
    CELO = 42220
    CELO_ALFAJORES = 44787
    LOCALHOST = 1338


NETWORKS = {
    ChainId.MAINNET: {
        "title": "Ethereum",
        "scan_url": "https://etherscan.io",
        "subgraph_url": (
            "https://api.thegraph.com/subgraphs/name/humanprotocol/mainnet-v2"
        ),
        "hmt_address": "0xd1ba9BAC957322D6e8c07a160a3A8dA11A0d2867",
        "factory_address": "0xD9c75a1Aa4237BB72a41E5E26bd8384f10c1f55a",
        "staking_address": "0x05398211bA2046E296fBc9a9D3EB49e3F15C3123",
        "reward_pool_address": "0x4A5963Dd6792692e9147EdC7659936b96251917a",
        "kvstore_address": "0xB6d36B1CDaD50302BCB3DB43bAb0D349458e1b8D",
        "old_subgraph_url": "",
        "old_factory_address": "",
    },
    ChainId.GOERLI: {
        "title": "Ethereum Goerli",
        "scan_url": "https://goerli.etherscan.io",
        "subgraph_url": (
            "https://api.thegraph.com/subgraphs/name/humanprotocol/goerli-v2"
        ),
        "hmt_address": "0xd3A31D57FDD790725d0F6B78095F62E8CD4ab317",
        "factory_address": "0x87469B4f2Fcf37cBd34E54244c0BD4Fa0603664c",
        "staking_address": "0xf46B45Df3d956369726d8Bd93Ba33963Ab692920",
        "reward_pool_address": "0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4",
        "kvstore_address": "0x19Fc3e859C1813ac9427a7a78BeB9ae102CE96d3",
        "old_subgraph_url": (
            "https://api.thegraph.com/subgraphs/name/humanprotocol/goerli"
        ),
        "old_factory_address": "0xaAe6a2646C1F88763E62e0cD08aD050Ea66AC46F",
    },
    ChainId.BSC_MAINNET: {
        "title": "Binance Smart Chain",
        "scan_url": "https://bscscan.com",
        "subgraph_url": "https://api.thegraph.com/subgraphs/name/humanprotocol/bsc-v2",
        "hmt_address": "0x711Fd6ab6d65A98904522d4e3586F492B989c527",
        "factory_address": "0x92FD968AcBd521c232f5fB8c33b342923cC72714",
        "staking_address": "0xdFbB79dC35a3A53741be54a2C9b587d6BafAbd1C",
        "reward_pool_address": "0xf376443BCc6d4d4D63eeC086bc4A9E4a83878e0e",
        "kvstore_address": "0x21A0C4CED7aE447fCf87D9FE3A29FA9B3AB20Ff1",
        "old_subgraph_url": "https://api.thegraph.com/subgraphs/name/humanprotocol/bsc",
        "old_factory_address": "0xc88bC422cAAb2ac8812de03176402dbcA09533f4",
    },
    ChainId.BSC_TESTNET: {
        "title": "Binance Smart Chain (Testnet)",
        "scan_url": "https://testnet.bscscan.com",
        "subgraph_url": (
            "https://api.thegraph.com/subgraphs/name/humanprotocol/bsctest-v2"
        ),
        "hmt_address": "0xE3D74BBFa45B4bCa69FF28891fBE392f4B4d4e4d",
        "factory_address": "0x2bfA592DBDaF434DDcbb893B1916120d181DAD18",
        "staking_address": "0x5517fE916Fe9F8dB15B0DDc76ebDf0BdDCd4ed18",
        "reward_pool_address": "0xB0A0500103eCEc431b73F6BAd923F0a2774E6e29",
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
            "https://api.thegraph.com/subgraphs/name/humanprotocol/polygon-v2"
        ),
        "hmt_address": "0xc748B2A084F8eFc47E086ccdDD9b7e67aEb571BF",
        "factory_address": "0xBDBfD2cC708199C5640C6ECdf3B0F4A4C67AdfcB",
        "staking_address": "0xcbAd56bE3f504E98bd70875823d3CC0242B7bB29",
        "reward_pool_address": "0xa8e32d777a3839440cc7c24D591A64B9481753B3",
        "kvstore_address": "0xbcB28672F826a50B03EE91B28145EAbddA73B2eD",
        "old_subgraph_url": (
            "https://api.thegraph.com/subgraphs/name/humanprotocol/polygon"
        ),
        "old_factory_address": "0x45eBc3eAE6DA485097054ae10BA1A0f8e8c7f794",
    },
    ChainId.POLYGON_MUMBAI: {
        "title": "Polygon Mumbai",
        "scan_url": "https://mumbai.polygonscan.com",
        "subgraph_url": (
            "https://api.thegraph.com/subgraphs/name/humanprotocol/mumbai-v2"
        ),
        "hmt_address": "0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4",
        "factory_address": "0xA8D927C4DA17A6b71675d2D49dFda4E9eBE58f2d",
        "staking_address": "0x7Fd3dF914E7b6Bd96B4c744Df32183b51368Bfac",
        "reward_pool_address": "0xf0145eD99AC3c4f877aDa7dA4D1E059ec9116BAE",
        "kvstore_address": "0xD96158c7267Ea658a4688F4aEf1c85659851625d",
        "old_subgraph_url": (
            "https://api.thegraph.com/subgraphs/name/humanprotocol/mumbai"
        ),
        "old_factory_address": "0x558cd800f9F0B02f3B149667bDe003284c867E94",
    },
    ChainId.MOONBEAM: {
        "title": "Moonbeam",
        "scan_url": "https://moonbeam.moonscan.io",
        "subgraph_url": (
            "https://api.thegraph.com/subgraphs/name/humanprotocol/moonbeam-v2"
        ),
        "hmt_address": "0x3b25BC1dC591D24d60560d0135D6750A561D4764",
        "factory_address": "0xD9c75a1Aa4237BB72a41E5E26bd8384f10c1f55a",
        "staking_address": "0x05398211bA2046E296fBc9a9D3EB49e3F15C3123",
        "reward_pool_address": "0x4A5963Dd6792692e9147EdC7659936b96251917a",
        "kvstore_address": "0x2B95bEcb6EBC4589f64CB000dFCF716b4aeF8aA6",
        "old_subgraph_url": (
            "https://api.thegraph.com/subgraphs/name/humanprotocol/moonbeam"
        ),
        "old_factory_address": "0x98108c28B7767a52BE38B4860832dd4e11A7ecad",
    },
    ChainId.MOONBASE_ALPHA: {
        "title": "Moonbase Alpha",
        "scan_url": "https://moonbase.moonscan.io/",
        "subgraph_url": (
            "https://api.thegraph.com/subgraphs/name/humanprotocol/moonbase-alpha-v2"
        ),
        "hmt_address": "0x2dd72db2bBA65cE663e476bA8b84A1aAF802A8e3",
        "factory_address": "0x5e622FF522D81aa426f082bDD95210BC25fCA7Ed",
        "staking_address": "0xBFC7009F3371F93F3B54DdC8caCd02914a37495c",
        "reward_pool_address": "0xf46B45Df3d956369726d8Bd93Ba33963Ab692920",
        "kvstore_address": "0xcC561f4482f4Ff051D2Dcc65c2cE1A0f291bbA46",
        "old_subgraph_url": "",
        "old_factory_address": "",
    },
    ChainId.AVALANCHE: {
        "title": "Avalanche C-Chain Mainnet",
        "scan_url": "https://snowtrace.io",
        "subgraph_url": (
            "https://api.thegraph.com/subgraphs/name/humanprotocol/avalanche-v2"
        ),
        "hmt_address": "0x12365293cb6477d4fc2686e46BB97E3Fb64f1550",
        "factory_address": "0xD9c75a1Aa4237BB72a41E5E26bd8384f10c1f55a",
        "staking_address": "0x05398211bA2046E296fBc9a9D3EB49e3F15C3123",
        "reward_pool_address": "0x4A5963Dd6792692e9147EdC7659936b96251917a",
        "kvstore_address": "0x9Bc7bff35B2Be2413708d48c3B0aEF5c43646728",
        "old_subgraph_url": (
            "https://api.thegraph.com/subgraphs/name/humanprotocol/avalanche"
        ),
        "old_factory_address": "0x9767a578ba7a5FA1563c8229943cB01cd8446BB4",
    },
    ChainId.AVALANCHE_TESTNET: {
        "title": "Fuji C-Chain",
        "scan_url": "https://testnet.snowtrace.io",
        "subgraph_url": "https://api.thegraph.com/subgraphs/name/humanprotocol/fuji-v2",
        "hmt_address": "0x9406d5c635AD22b0d76c75E52De57A2177919ca3",
        "factory_address": "0x56C2ba540726ED4f46E7a134b6b9Ee9C867FcF92",
        "staking_address": "0x9890473B0b93E24d6D1a8Dfb739D577C6f25FFd3",
        "reward_pool_address": "0x5517fE916Fe9F8dB15B0DDc76ebDf0BdDCd4ed18",
        "kvstore_address": "0x3aD4B091E054f192a822D1406f4535eAd38580e4",
        "old_subgraph_url": (
            "https://api.thegraph.com/subgraphs/name/humanprotocol/fuji"
        ),
        "old_factory_address": "0xfb4469201951C3B9a7F1996c477cb7BDBEcE0A88",
    },
    ChainId.CELO: {
        "title": "Celo",
        "scan_url": "https://celoscan.io/",
        "subgraph_url": "https://api.thegraph.com/subgraphs/name/humanprotocol/celo",
        "hmt_address": "0x19Ead835951493A763c96910255d5eeF147E914F",
        "factory_address": "0xc90B43a5d576D9d8026c48904dfbaED50C15Fa08",
        "staking_address": "0x34cD3Bd6B16c559f321799b516dE61E12017fFd1",
        "reward_pool_address": "0xb9344bAD98E3d26a4d83900922baf395a2Ec154c",
        "kvstore_address": "0x86Af9f6Cd34B69Db1B202223C6d6D109f2491569",
        "old_subgraph_url": "",
        "old_factory_address": "",
    },
    ChainId.CELO_ALFAJORES: {
        "title": "Celo",
        "scan_url": "https://alfajores.celoscan.io/",
        "subgraph_url": (
            "https://api.thegraph.com/subgraphs/name/humanprotocol/celo-alfajores"
        ),
        "hmt_address": "0x2736B33455A872dC478E1E004106D04c35472468",
        "factory_address": "0x86Af9f6Cd34B69Db1B202223C6d6D109f2491569",
        "staking_address": "0x003548Df34be8836cF0F9673403a1E40ba449a0F",
        "reward_pool_address": "0xA9545C2530BD5bdb464d5E274F59ACceAa73eD86",
        "kvstore_address": "0x938335006ea6F9Eb0e8020969cFF94404425e298",
        "old_subgraph_url": "",
        "old_factory_address": "",
    },
    ChainId.SKALE: {
        "title": "SKALE Human Protocol Chain",
        "scan_url": "https://wan-red-ain.explorer.mainnet.skalenodes.com/",
        "subgraph_url": (
            "https://graph-skale.humanprotocol.org/subgraphs/name/skale-human"
        ),
        "hmt_address": "0x6E5FF61Ea88270F6142E0E0eC8cbe9d67476CbCd",
        "factory_address": "0x319070b49C8d1cC015915D1E7Eb5fd8e22833885",
        "staking_address": "0x79F37FB9C210910733c16228AC4D14a8e32C11BD",
        "reward_pool_address": "0x881218246c25C6898aE96145259584340153aDA2",
        "kvstore_address": "0xE1055607327b1be2080D31211dCDC4D9338CaF4A",
        "old_subgraph_url": "",
        "old_factory_address": "0x27B423cE73d1dBdB48d2dd351398b5Ce8223117c",
    },
    ChainId.LOCALHOST: {
        "title": "Localhost",
        "scan_url": "",
        "subgraph_url": "subgraph_url",
        "hmt_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        "factory_address": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
        "staking_address": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
        "reward_pool_address": "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
        "kvstore_address": "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
        "old_subgraph_url": "",
        "old_factory_address": "",
    },
}


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

    validator = "Validator"
    job_launcher = "Job Launcher"
    exchange_oracle = "Exchange Oracle"
    reputation_oracle = "Reputation Oracle"
    recording_oracle = "Recording Oracle"


ARTIFACTS_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "artifacts")

GAS_LIMIT = int(os.getenv("GAS_LIMIT", 4712388))


class KVStoreKeys(Enum):
    """Enum for KVStore keys"""

    role = "role"
    fee = "fee"
    public_key = "public_key"
    webhook_url = "webhook_url"
    url = "url"
