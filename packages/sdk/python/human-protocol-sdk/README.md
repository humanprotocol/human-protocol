# Human Protocol Python SDK

Python SDK to launch/manage jobs on [Human Protocol](https://www.humanprotocol.org/)

## Installation

### Manual

You need few essential system requirements to successfully install our Python 3 package.

#### Debian / Ubuntu

[Python3](https://www.python.org/), and [pipenv](https://pipenv.pypa.io/en/latest/) is required.

Install virtual environment using `pipenv`.

```
pipenv install
```

```
pip install git+https://github.com/ethereum/trinity@master#egg=trinity \
            git+https://github.com/sphinx-doc/sphinx@master#egg=sphinx

pip install human-protocol-sdk
```

### Getting Started

Creating a new HUMAN Protocol Escrow requires a Web3 instance, an ERC20 token address to
use for pay outs, a list of addresses that can that can perform actions on the contract
and an EscrowConfig instance containing all the necessary information to setup an escrow.

Additionally, it requires a number of tokens to be previously staked.

First, a Web3 instance can be created following the specification at
https://web3py.readthedocs.io/en/stable/quickstart.html. In addition, an account must be
added to the instance to enable blockchain transaction signing.

Second, Manifest has to follow the specification at https://github.com/hCaptcha/hmt-basemodels
and can be uploaded using storage client.

Thirdly, EscrowConfig must be created following this format:

```
>>> escrow_config = EscrowConfig(
... 	recording_oracle_address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
... 	reputation_oracle_address = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
... 	recording_oracle_fee = 10,
... 	reputation_oracle_fee = 10,
... 	manifest_url = "http://localhost:9000/manifests/manifest.json",
... 	hash = "s3ca3basd132bafcdas234243.json"
... )
```

Calling create_and_setup_escrow, the escrow can be created and set up as follows:

```
>>> escrow_client = EscrowClient(w3)
>>> escrow_address = escrow_client.create_and_setup_escrow(
... 	token_address = "0x5FbDB2315678afecb367f032d93F642f64180aa3",
... 	trusted_handlers = ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"],
... 	escrow_config = escrow_config
... )
```

The escrow must then be funded.

```
>>> escrow_client.fund(
... 	escrow_address = escrow_address,
... 	amount = Decimal('100.0')
... )
```

While no payouts have been performed, aborting and canceling a job is still possible.

```
>>> escrow_client.abort(escrow_address = escrow_address)
>>> escrow_client.cancel(escrow_address = escrow_address)
```

Performing a bulk payout that doesn't fully drain the escrow contract sets the contract to
Partial state. It also uploads the final results from the Reputation Oracle to the contract's
state.

```
>>> escrow_client.bulk_payout(escrow_address = escrow_address,
... 	recipients = ['0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'],
... 	amounts = [Decimal('20.0')],
... 	final_results_url: 'http://localhost:9000/manifests/s3ca3basd132bafcdas234243.json',
... 	final_results_hash: 's3ca3basd132bafcdas234243.json',
... 	txId: Decimal(1))
>>> job.status()
<Status.Partial: 2>
```

Draining the escrow contract fully sets the contract to Paid state.

```
>>> escrow_client.bulk_payout(escrow_address = escrow_address,
... 	recipients = ['0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'],
... 	amounts = [Decimal('80.0')],
... 	final_results_url: 'http://localhost:9000/results/s3ca3basd132bafcdas234243.json',
... 	final_results_hash: 's3ca3basd132bafcdas234243.json',
... 	txId: Decimal(1))
>>> job.status()
<Status.Paid: 3>
```

Completing the escrow sets a Paid contract to complete.

```
>>> escrow_client.complete(escrow_address = escrow_address)
>>> job.status()
<Status.Complete: 4>
```

## Note for maintainers: Deploying to PyPi

A build will automatically be deployed to PyPi from master if tagged with a version number. This version number should match the version in the `setup.py` file.

The tags will need to be pushed to master via a user that has the proper privileges (see the contributors of this repo).

Versioning should follow the [semver](https://semver.org/) versioning methodology and not introduce breaking changes on minor or patch-level changes.

## Have a question?

Join our [Telegram](https://hmt.ai/telegram) channel, we will gladly answer your questions.
