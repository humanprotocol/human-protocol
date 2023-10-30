from enum import EnumMeta


class BetterEnumMeta(EnumMeta):
    """
    Extends the default enum metaclass with extra methods for better usability
    """

    def __contains__(cls, item):
        return isinstance(item, cls) or item in [v.value for v in cls.__members__.values()]
