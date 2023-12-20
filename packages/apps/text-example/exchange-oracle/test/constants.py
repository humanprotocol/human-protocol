from test.utils import Signer
from enum import Enum


class Environments(str, Enum):
    TEST = "test"
    PROD = "production"
    DEV = "development"


JOB_LAUNCHER = Signer(
    address="0x514b41D62325CF7f73f5D54cC3f58dEe72d80f8B",
    private_key="0x6882171ad3989B33914bDC9Df3dfEB6C4B4c2C59143014782599888792929536",
)
