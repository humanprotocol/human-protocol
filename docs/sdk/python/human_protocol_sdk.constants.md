# human_protocol_sdk.constants module

### *class* human_protocol_sdk.constants.ChainId(value)

Bases: `Enum`

Enum for chain IDs.

#### AVALANCHE *= 43114*

#### AVALANCHE_TESTNET *= 43113*

#### BSC_MAINNET *= 56*

#### BSC_TESTNET *= 97*

#### CELO *= 42220*

#### CELO_ALFAJORES *= 44787*

#### GOERLI *= 5*

#### LOCALHOST *= 1338*

#### MAINNET *= 1*

#### MOONBASE_ALPHA *= 1287*

#### MOONBEAM *= 1284*

#### POLYGON *= 137*

#### POLYGON_AMOY *= 80002*

#### POLYGON_MUMBAI *= 80001*

#### RINKEBY *= 4*

#### SEPOLIA *= 11155111*

#### XLAYER *= 196*

#### XLAYER_TESTNET *= 195*

### *class* human_protocol_sdk.constants.KVStoreKeys(value)

Bases: `Enum`

Enum for KVStore keys

#### fee *= 'fee'*

#### job_types *= 'job_types'*

#### public_key *= 'public_key'*

#### role *= 'role'*

#### url *= 'url'*

#### webhook_url *= 'webhook_url'*

### *class* human_protocol_sdk.constants.OrderDirection(value)

Bases: `Enum`

Enum for chain IDs.

#### ASC *= 'asc'*

#### DESC *= 'desc'*

### *class* human_protocol_sdk.constants.Role(value)

Bases: `Enum`

Enum for roles.

#### exchange_oracle *= 'Exchange Oracle'*

#### job_launcher *= 'Job Launcher'*

#### recording_oracle *= 'Recording Oracle'*

#### reputation_oracle *= 'Reputation Oracle'*

#### validator *= 'Validator'*

### *class* human_protocol_sdk.constants.Status(value)

Bases: `Enum`

Enum for escrow statuses.

#### Cancelled *= 5*

#### Complete *= 4*

#### Launched *= 0*

#### Paid *= 3*

#### Partial *= 2*

#### Pending *= 1*
