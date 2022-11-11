# Human Protocol Python SDK

Python SDK to launch/manage jobs on [Human Protocol](https://www.humanprotocol.org/)

## Installation

### Manual

You need few essential system requirements to successfully install our Python 3 package.

### Annoying testing feature

Rightly or Wrongly we tried to use doctests for the vast majority of testing in this project
. As a result you may have to remove the raise_on_error=True in the module you are testing
to get good feedback on what's broken.

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

Creating a new HUMAN Protocol Job requires a manifest and credentials at minimum. Optionally a factory
address and/or an escrow address can be given. Using an existing factory address can be used to deploy
a new Job to the Ethereum network. Using an existing factory address and escrow address together an
existing Job on the Ethereum network can be accessed. Creating a Job without a factory address deploys
a fresh factory to the Ethereum network.

A Manifest has to follow the specification at https://github.com/hCaptcha/hmt-basemodels

Credentials must follow the following format:

```
>>> credentials = {
... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
... }
>>> rep_oracle_pub_key = b"8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"
```

Using only the Manifest and Credentials deploys a new factory to the Ethereum network
with the public key of a known Reputation Oracle.

```
>>> job = Job(credentials, manifest)
>>> job.launch(rep_oracle_pub_key)
True
```

Providing an existing factory address is done via the Job's class attributes.

```
>>> factory_addr = deploy_factory(**credentials)
>>> job = Job(credentials, manifest, factory_addr)
>>> job.launch(rep_oracle_pub_key)
True
```

You can supply an existing escrow factory address when instantiating the class, which
it will use to do all operations. If an escrow factory address is not given, it creates one.

Credentials have to contain the private key that was used to upload
the previously deployed manifest to IPFS. The Job is instantiated with the fetched
manifest.

```
>>> credentials = {
... 	"gas_payer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
... 	"gas_payer_priv": "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
...     "rep_oracle_priv_key": b"ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
... }

>>> factory_addr = deploy_factory(**credentials)
>>> escrow_addr = job.job_contract.address
```

If you provide an `escrow_addr` and a `factory_addr` the library will check
whether that `escrow_addr` belongs to the `factory_addr`. If that succeeds
you can continue from the state the contract is in.

A Job can only be launched once: calling `launch()` will return False if
you previously launched it.

```
>>> accessed_job = Job(credentials=credentials, factory_addr=factory_addr, escrow_addr=escrow_addr)
>>> accessed_job.launch(rep_oracle_pub_key)
False
```

Calling setup funds the deployed escrow contract and updates its state with data from the manifest.

```
>>> job.setup()
True
```

While no payouts have been performed, aborting and canceling a job is still possible.

```
>>> job.abort()
True
>>> job.cancel()
True
```

Performing a bulk payout that doesn't fully drain the escrow contract sets the contract to
Partial state. It also uploads the final results from the Reputation Oracle to the contract's
state.

```
>>> payouts = [("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", Decimal('20.0'))]
>>> job.bulk_payout(payouts, {}, rep_oracle_pub_key)
True
>>> job.status()
<Status.Partial: 3>
```

Draining the escrow contract fully sets the contract to Paid state.

```
>>> payouts = [("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", Decimal('80.0'))]
>>> job.bulk_payout(payouts, {}, rep_oracle_pub_key)
True
>>> job.status()
<Status.Paid: 4>
```

Completing the job sets a Paid contract to complete.

```
>>> job.complete()
True
>>> job.status()
<Status.Partial: 5>
```

## Note for maintainers: Deploying to PyPi

A build will automatically be deployed to PyPi from master if tagged with a version number. This version number should match the version in the `setup.py` file.

The tags will need to be pushed to master via a user that has the proper privileges (see the contributors of this repo).

Versioning should follow the [semver](https://semver.org/) versioning methodology and not introduce breaking changes on minor or patch-level changes.

## Have a question?

Join our [Telegram](https://hmt.ai/telegram) channel, we will gladly answer your questions.
