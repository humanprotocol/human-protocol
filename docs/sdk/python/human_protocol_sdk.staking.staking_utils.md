# human_protocol_sdk.staking.staking_utils module

Utility class for staking-related operations.

## Code Example

```python
from human_protocol_sdk.constants import ChainId
from human_protocol_sdk.staking.staking_utils import StakingUtils, StakersFilter

stakers = StakingUtils.get_stakers(
    StakersFilter(
        chain_id=ChainId.POLYGON_AMOY,
        min_staked_amount="1000000000000000000",
        max_locked_amount="5000000000000000000",
        order_by="withdrawnAmount",
        order_direction="asc",
        first=5,
        skip=0,
    )
)
print("Filtered stakers:", stakers)
```

## Module

### *class* human_protocol_sdk.staking.staking_utils.StakerData(id, address, staked_amount, locked_amount, withdrawn_amount, slashed_amount, locked_until_timestamp, last_deposit_timestamp)

Bases: `object`

#### \_\_init_\_(id, address, staked_amount, locked_amount, withdrawn_amount, slashed_amount, locked_until_timestamp, last_deposit_timestamp)

### *class* human_protocol_sdk.staking.staking_utils.StakingUtils

Bases: `object`

#### *static* get_staker(chain_id, address, options=None)

* **Return type:**
  `Optional`[[`StakerData`](#human_protocol_sdk.staking.staking_utils.StakerData)]

#### *static* get_stakers(filter, options=None)

* **Return type:**
  `List`[[`StakerData`](#human_protocol_sdk.staking.staking_utils.StakerData)]

### *exception* human_protocol_sdk.staking.staking_utils.StakingUtilsError

Bases: `Exception`
