import setuptools

setuptools.setup(
    name="human-protocol-basemodels",
    author="HUMAN Protocol",
    description="Common data models shared by various components of the Human Protocol stack",
    url="https://github.com/humanprotocol/human-protocol/packages/sdk/python/human-protocol-basemodels",
    include_package_data=True,
    zip_safe=True,
    classifiers=[
        "Intended Audience :: Developers",
        "Operating System :: OS Independent",
        "Programming Language :: Python",
    ],
    packages=setuptools.find_packages(),
    install_requires=["requests>=2", "typing-extensions", "pydantic>=1.6"],
)
