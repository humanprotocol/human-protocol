# Human Protocol MultiversX Smart Contracts

## Contracts

Available Contracts:

- EscrowContract
- EscrowFactoryContract
- KVStoreContract
- RewardsPoolContract
- StakingContract

## Development Setup

This entire directory of `mx` is a cargo workspace that contains all the contracts and the tests for them. To add a new
contract to the workspace, after adding it to the `contracts` directory, add it to the `members` array in the
`Cargo.toml` file from root of `mx`.

In order to write contracts and be able to build/test/deploy them there are some small prerequisites that need to be
installed. There is a tutorial section on MultiversX Docs that can be followed to install everything necessary right
here [MultiversX Docs](https://docs.multiversx.com/developers/tutorials/your-first-dapp#software-prerequisites)

For a simple fast install on Debian environments run the following:

**Install python 3.8, pip and libncurses5**

```bash
sudo apt-get update
sudo apt install libncurses5 build-essential python3-pip nodejs npm python3.8-venv
```

**Install mxpy**

```bash
wget -O mxpy-up.py https://raw.githubusercontent.com/multiversx/mx-sdk-py-cli/main/mxpy-up.py
python3 mxpy-up.py
```

**Install MultiversX IDE VSCode extension**

[MultiversX IDE VSCode](https://marketplace.visualstudio.com/items?itemName=Elrond.vscode-elrond-ide)

## Building contracts

You can use a multitude of ways for building the contracts:

- in the MultiversX VSCode extension right click on contract and choose build
- directly right click on the contract directory in the source tree and choose build
- in a console inside the contract directory type `mxpy contract build`

For building all the contracts inside the `contracts` directory there is a script called `build-mx-contracts.sh`.
Run the script from the `mx` root directory and will automatically compile and build all the contracts.

The same principle goes for cleaning the `output` directories of the contracts. Run the script `clean-mx-contracts.sh`
from the `mx` root directory and will clean all contracts.

## Test contracts

To run all tests from the `mx` directory, run from the root of this directory:

```bash
cargo test
```

If you want to run tests for only one contract you can run the same command as above but from the contract root
directory.

### Troubleshooting

If with `cargo test` the test are not able to run, you can try to clean your contract output and build it once again,
or in other cases just run build once again.
