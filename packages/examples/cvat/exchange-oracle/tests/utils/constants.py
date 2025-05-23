from textwrap import dedent

DEFAULT_GAS_PAYER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
DEFAULT_GAS_PAYER_PRIV = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

RECORDING_ORACLE_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
RECORDING_ORACLE_PRIV = "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
RECORDING_ORACLE_FEE = 10

REPUTATION_ORACLE_WEBHOOK_URL = "http://localhost:5001/webhook/cvat"
REPUTATION_ORACLE_ADDRESS = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
REPUTATION_ORACLE_FEE = 10

EXCHANGE_ORACLE_ADDRESS = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
EXCHANGE_ORACLE_FEE = 10

JOB_LAUNCHER_ADDRESS = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"

ESCROW_ADDRESS = "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"
TOKEN_ADDRESS = "0x976EA74026E726554dB657fA54763abd0C3a0aa9"
FACTORY_ADDRESS = "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"

WALLET_ADDRESS1 = "0x86e83d346041E8806e352681f3F14549C0d2BC69"
WALLET_ADDRESS2 = "0x86e83d346041E8806e352681f3F14549C0d2BC70"

DEFAULT_MANIFEST_URL = "http://host.docker.internal:9000/manifests/manifest.json"
DEFAULT_HASH = "test"

SIGNATURE = (
    "0xa0c5626301e3c198cb91356e492890c0c28db8c37044846134939246911a693c"
    "4d7116d04aa4bc40a41077493868b8dd533d30980f6addb28d1b3610a84cb4091c"
)

WEBHOOK_MESSAGE = {
    "escrow_address": "0x12E66A452f95bff49eD5a30b0d06Ebc37C5A94B6",
    "chain_id": 80002,
    "event_type": "escrow_created",
    "event_data": {},
}

WEBHOOK_MESSAGE_SIGNED = (
    "0x82d5c5845da8456226baf58862c1cefd964c884464f73b66abed938475bbd7e8"
    "10bf99a10f2ad68e7febb7460112788c060e16e25d0e7c4e2e2dc7aafd9b81861c"
)

PGP_PASSPHRASE = "passphrase"
PGP_PRIVATE_KEY1 = dedent(
    """\
    -----BEGIN PGP PRIVATE KEY BLOCK-----

    xYYEZKLMDhYJKwYBBAHaRw8BAQdAufXwhFItFe4j2IuTa3Yc4lZMNAxV/B+k
    X8mJ5PzqY4f+CQMISyqDKFlj2s/gu7LzRcFRveVbtXvQJ6lvwWEpUgkc0NAL
    HykIe1gLJhsoR+v5J5fXTYwDridyL4YPLJCp7yF1K3FtyOV8Cqg46N5ijbGd
    Gs0USHVtYW4gPGh1bWFuQGhtdC5haT7CjAQQFgoAPgUCZKLMDgQLCQcICRCw
    ZMhlX2d7bQMVCAoEFgACAQIZAQIbAwIeARYhBO+K/xc4J5im5sY6hbBkyGVf
    Z3ttAABgBQD/fmxM+HNCObu4+lJPDZqFR9GKOXF8pFZzmnfrHQs1f6YBALHB
    SCttHaeBk5rkT4BAzy3Krx+HWoy+szmE141E1/8Jx4sEZKLMDhIKKwYBBAGX
    VQEFAQEHQPwH1OONj4rKhhH3BQTW0JoKLU3hmgYUqxx7LcfnLzQAAwEIB/4J
    Awhl3IXvo7mhyuAZwgOcvaH1X9ijw5l/VffBLYBhtmEnvN62iNZPNashQL26
    GOhrAB/v5I1XLacKNrwNP47UVGl/jz014ZBYTPGabhGl2kVQwngEGBYIACoF
    AmSizA4JELBkyGVfZ3ttAhsMFiEE74r/FzgnmKbmxjqFsGTIZV9ne20AAEYN
    AQDLkJ4V88iG2wEbVd3aGzu58PlcAh1bPROzrcy1ItuUxAD+JtI1n46vMPtH
    TPVPv/q9RajJP6u0VPCG/ByV1DjGhgc=
    =uaJU
    -----END PGP PRIVATE KEY BLOCK-----
"""
)

PGP_PUBLIC_KEY1 = dedent(
    """\
    -----BEGIN PGP PUBLIC KEY BLOCK-----

    xjMEZKLMDhYJKwYBBAHaRw8BAQdAufXwhFItFe4j2IuTa3Yc4lZMNAxV/B+k
    X8mJ5PzqY4fNFEh1bWFuIDxodW1hbkBobXQuYWk+wowEEBYKAD4FAmSizA4E
    CwkHCAkQsGTIZV9ne20DFQgKBBYAAgECGQECGwMCHgEWIQTviv8XOCeYpubG
    OoWwZMhlX2d7bQAAYAUA/35sTPhzQjm7uPpSTw2ahUfRijlxfKRWc5p36x0L
    NX+mAQCxwUgrbR2ngZOa5E+AQM8tyq8fh1qMvrM5hNeNRNf/Cc44BGSizA4S
    CisGAQQBl1UBBQEBB0D8B9TjjY+KyoYR9wUE1tCaCi1N4ZoGFKscey3H5y80
    AAMBCAfCeAQYFggAKgUCZKLMDgkQsGTIZV9ne20CGwwWIQTviv8XOCeYpubG
    OoWwZMhlX2d7bQAARg0BAMuQnhXzyIbbARtV3dobO7nw+VwCHVs9E7OtzLUi
    25TEAP4m0jWfjq8w+0dM9U+/+r1FqMk/q7RU8Ib8HJXUOMaGBw==
    =62qY
    -----END PGP PUBLIC KEY BLOCK-----
"""
)

PGP_PUBLIC_KEY2 = dedent(
    """\
    -----BEGIN PGP PUBLIC KEY BLOCK-----

    xjMEZKKJZRYJKwYBBAHaRw8BAQdAiy9Cvf7Stb5uGaPWTxhk2kEWgwHI75PK
    JAN1Re+mZ/7NFEh1bWFuIDxodW1hbkBobXQuYWk+wowEEBYKAD4FAmSiiWUE
    CwkHCAkQLJTUgF16PUcDFQgKBBYAAgECGQECGwMCHgEWIQRHZsSFAPBxClHV
    TEYslNSAXXo9RwAAUYYA+gJKoCHiEl/1AUNKZrWBmvS3J9BRAFgvGHFmUKSQ
    qvCJAP9+M55C/K0QjO1B9N14TPsnENaB0IIlvavhNUgKow9sBc44BGSiiWUS
    CisGAQQBl1UBBQEBB0DWVuH+76KUCwGbLNnrTAGxysoo6TWpkG1upYQvZztB
    cgMBCAfCeAQYFggAKgUCZKKJZQkQLJTUgF16PUcCGwwWIQRHZsSFAPBxClHV
    TEYslNSAXXo9RwAA0dMBAJ0cd1OM/yWJdaVQcPp4iQOFh7hAOZlcOPF2NTRr
    1AvDAQC4Xx6swMIiu2Nx/2JYXr3QdUO/tBtC/QvU8LPQETo9Cg==
    =4PJh
    -----END PGP PUBLIC KEY BLOCK-----
"""
)
