from enum import Enum
from src.config import Config


class Networks(int, Enum):
    polygon_mainnet = Config.polygon_mainnet.chain_id
    polygon_mumbai = Config.polygon_mumbai.chain_id
