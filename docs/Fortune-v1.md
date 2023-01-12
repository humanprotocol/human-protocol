# Job Launcher
## Functionality
Jobs requesters can choose to pay with crypto or fiat:
### Crypto
1. Connect metamask wallet
2. Fill a form with (part of this data will be uploaded to s3 as job manifest):
	- Network
	- Title
	- Description
	- Number of fortunes requested
	- Token for funding
	- Fund amount
3. A transaction to send to the job launcher address the amount for funding the escrow + fee must be approved in metamask.
4. The job launcher will create, set up and fund the escrow and set the job requester address as trusted handler.
### Fiat
1. Fill a form with (part of this data will be uploaded to s3 as job manifest):
	- Network
	- Title
	- Description
	- Number of fortunes requested
	- Token for funding will be USDC
	- Fund amount
	- Job requester address
2. Redirection to payment gateway. The job requester will pay for the fund amount + fee.
3. The job launcher will create, set up and fund the escrow and set the job requester address as trusted handler.

Before creating the escrow the Job Launcher should do a check for curse words.

## Implementation
Job launcher must have both client and server, since the server will contain the private key of the address that will act as liquidity address and where all crypto payments will be received.
The job launcher must have staking and then allocate for each escrow created to be able to set them up, as well as the role "Job Launcher" in KVStore.

# Exchange Oracle
## Functionality
In the Exchange Oracle client, fortune tellers should be able to:
1. Search for an escrow.
2. See the job manifest.
3. Connect metamask wallet.
4. Send fortune

An exchange oracle user can click the abuse button if the question contains porn or similar to slash job launcher.

The fortunes are buffered in the exchange oracle server and once a specific number of fortunes has been reached, all the buffered fortunes will be sent to the recording oracle.

## Implementation
Exchange Oracle must have both client and server.
The exchange oracle must have staking and as well as the role "exchange oracle" in KVStore.

# Recording Oracle
## Functionality
1. Uniqueness check.
2. Curse words check.
3. Add fortune to results file as valid or refused.
4. If the number of valid fortunes requiered is reached, send fortunes to Reputation Oracle.

## Implementation
Only server.
The recording oracle must have staking and as well as the role "recording oracle" in KVStore.

# Reputation Oracle
## Functionality
1. Check received fortunes from Recording Oracle for Uniqueness. In case of duplicateds exist decrease Recording Oracle reputation and slash.
2. Check received fortunes from Recording Oracle for Curse words. In case of curse words exist decrease Recording Oracle reputation and slash.
3. Generate final results file with valid fortunes.
4. Increase or decrease fortune tellers reputation according with the results received from Recording Oracle.
4. Payout to job launcher, oracles and fortune tellers according to their reputation.

## Implementation
Only server.
The reputation oracle must have staking and as well as the role "Reputation oracle" in KVStore.



# Questions:
***When would the exchange oracle be slashed? Who could request the slashing?***

***How can a Recording Oracle validate that the received fortunes are coming from a specific Exchange Oracle?***

***When would the reputation oracle be slashed? Who could request the slashing?***