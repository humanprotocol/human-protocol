import setuptools

setuptools.setup(
    name="human-protocol-sdk",
    version="0.0.0",
    author="HUMAN Protocol",
    description="A python library to launch escrow contracts to the HUMAN network.",
    url="https://github.com/humanprotocol/human-protocol/packages/sdk/python/human-protocol-sdk",
    include_package_data=True,
    exclude_package_data={"artifacts": ["*.dbg.json"]},
    zip_safe=True,
    classifiers=[
        "Intended Audience :: Developers",
        "Operating System :: OS Independent",
        "Programming Language :: Python",
    ],
    packages=setuptools.find_packages() + ["artifacts"],
    setup_requires="setuptools-pipfile",
    use_pipfile=True,
    extras_require={"agreement": ["numpy", "pyerf"]},
)
