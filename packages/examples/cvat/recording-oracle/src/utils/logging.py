import logging
from typing import NewType, Optional, Union

from src.utils.stack import current_function_name

LogLevel = NewType("LogLevel", int)


TRACE = 5
logging.addLevelName(TRACE, "TRACE")


def parse_log_level(level: str) -> LogLevel:
    return logging._nameToLevel[level.upper()]


def get_function_logger(
    parent_logger: Optional[Union[str, logging.Logger]] = None,
) -> logging.Logger:
    if isinstance(parent_logger, str):
        parent_logger = logging.getLogger(parent_logger)
    else:
        parent_logger = parent_logger or logging.getLogger()

    function_name = current_function_name(depth=2)
    return parent_logger.getChild(function_name)


class NullLogger(logging.Logger):
    def __init__(self, name: str = "", level=0) -> None:
        super().__init__(name, level)
        self.disabled = True
