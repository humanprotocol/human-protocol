# human_protocol_sdk.constants module

### *class* human_protocol_sdk.constants.ChainId(value)

Bases: `Enum`

Enum for chain IDs.

#### AURORA_TESTNET *= 1313161555*

#### BSC_MAINNET *= 56*

#### BSC_TESTNET *= 97*

#### LOCALHOST *= 1338*

#### MAINNET *= 1*

#### POLYGON *= 137*

#### POLYGON_AMOY *= 80002*

#### SEPOLIA *= 11155111*

### *class* human_protocol_sdk.constants.KVStoreKeys(value)

Bases: `Enum`

Enum for KVStore keys

#### category *= 'category'*

#### fee *= 'fee'*

#### job_types *= 'job_types'*

#### operator_name *= 'name'*

#### public_key *= 'public_key'*

#### public_key_hash *= 'public_key_hash'*

#### registration_instructions *= 'registration_instructions'*

#### registration_needed *= 'registration_needed'*

#### role *= 'role'*

#### url *= 'url'*

#### webhook_url *= 'webhook_url'*

#### website *= 'website'*

### *class* human_protocol_sdk.constants.OperatorCategory(value)

Bases: `Enum`

Enum for operator categories

#### MACHINE_LEARNING *= 'machine_learning'*

#### MARKET_MAKING *= 'market_making'*

### *class* human_protocol_sdk.constants.OrderDirection(value)

Bases: `Enum`

Enum for chain IDs.

#### ASC *= 'asc'*

#### DESC *= 'desc'*

### *class* human_protocol_sdk.constants.Role(value)

Bases: `Enum`

Enum for roles.

#### exchange_oracle *= 'exchange_oracle'*

#### job_launcher *= 'job_launcher'*

#### recording_oracle *= 'recording_oracle'*

#### reputation_oracle *= 'reputation_oracle'*

### *class* human_protocol_sdk.constants.Status(value)

Bases: `Enum`

Enum for escrow statuses.

#### Cancelled *= 5*

#### Complete *= 4*

#### Launched *= 0*

#### Paid *= 3*

#### Partial *= 2*

#### Pending *= 1*

#### ToCancel *= 6*
