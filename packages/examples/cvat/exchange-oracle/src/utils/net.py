import ipaddress


def is_ipv4(addr: str, *, allow_port: bool = True) -> bool:
    try:
        if allow_port:
            addr = addr.split(":", maxsplit=1)[0]
        ipaddress.IPv4Address(addr)
        return True
    except ValueError:
        return False
