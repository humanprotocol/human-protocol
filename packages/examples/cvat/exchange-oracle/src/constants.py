from enum import Enum
from src.config import Config


class Networks(int, Enum):
    polygon_mainnet = Config.polygon_mainnet.network_id
    polygon_mumbai = Config.polygon_mumbai.network_id
