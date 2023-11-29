<div align="center">
  <h1>Human Protocol Rust SDK</h1>

  <p>
    <strong>Launching and managing escrows on <a href="https://www.humanprotocol.org">Human Protocol</a> with Rust</strong>
  </p>
</div>

# Overview

### EscrowClient

The **EscrowClient** enables actions on Escrow contracts and retrieves information from both the contracts and the subgraph. The SDK dynamically selects the appropriate network based on the chain ID.

### KVStoreClient

The **KVStoreClient** allows actions on KVStore contracts and retrieves information from both the contracts and the subgraph. The SDK dynamically selects the appropriate network based on the chain ID.

### StakingClient

The **StakingClient** empowers actions on staking contracts and retrieves staking-related information from both the contracts and the subgraph. The SDK dynamically selects the appropriate network based on the chain ID.

## Instalation
```bash
cd human-protocol-sdk
cargo build
cargo run
```

## Testing
```bash
cd human-protocol-sdk
cargo test
cargo test --doc
```

## Usage

Escrow client:

```rust
use human_protocol_sdk::escrow::EscrowClient;
use human_protocol_sdk::kvstore::KVStoreClient;
use human_protocol_sdk::staking::StakingClient;
use crate::constants::{NETWORKS};
use crate::enums::{ChainId};

fn main() {
    let network = NETWORKS.get(&ChainId::PolygonMumbai).unwrap();
    let transport = web3::transports::Http::new("NODE_ENDPOINT").unwrap();
    let web3 = web3::Web3::new(transport);
    let account: SecretKey = SecretKey::from_str("PRIVATE_KEY").unwrap();

    let escrow_factory_address = Address::from_str(network.factory_address).unwrap();
    let token_address = network.hmt_address.to_string();

    let escrow_client = EscrowClient::new(&web3, escrow_factory_address, account).await;

    let trusted_handlers = vec!["0x1111111111111111111111111111111111111111".to_string()];
    let job_requester_id = "1234567890".to_string();
    let escrow_config = EscrowConfig {
        recording_oracle: "0xaaaabbbbccccdddd111122223333444455556666".to_string(),
        reputation_oracle: "0xbbbbccccddddeeeeffff11112222333344445555".to_string(),
        exchange_oracle: "0xccccddddeeeeffff111122223333444455556666".to_string(),
        recording_oracle_fee: 100.into(),
        reputation_oracle_fee: 150.into(),
        exchange_oracle_fee: 200.into(),
        manifest_url: "https://example.com/escrow-manifest.json".to_string(),
        manifest_hash: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef".to_string(),
    };
    
    match escrow_client.create_and_setup_escrow(
        token_address, 
        trusted_handlers, 
        job_requester_id, 
        escrow_config
    ).await {
        Ok(escrow_address) => println!("Escrow has been created and set up with address {:?}", escrow_address),
        Err(err) => println!("{:?}", err)
    };
}
```

Staking client:

```rust
use human_protocol_sdk::escrow::EscrowClient;
use human_protocol_sdk::kvstore::KVStoreClient;
use human_protocol_sdk::staking::StakingClient;
use crate::constants::{NETWORKS};
use crate::enums::{ChainId};

fn main() {
    let network = NETWORKS.get(&ChainId::PolygonMumbai).unwrap();
    let transport = web3::transports::Http::new("NODE_ENDPOINT").unwrap();
    let web3 = web3::Web3::new(transport);
    let account: SecretKey = SecretKey::from_str("PRIVATE_KEY").unwrap();

    let staking_address = network.staking_address.to_string();
    let token_address = network.hmt_address.to_string();
    let escrow_factory_address = Address::from_str(network.factory_address).unwrap();
    let reward_pool_address = network.reward_pool_address.to_string();
   
    let staking_client = StakingClient::new(&web3, staking_address, token_address, escrow_factory_address, reward_pool_address, account).await;
    
    let amount: u64 = 100;
    match staking_client.approve_stake(
        amount
    ).await {
        Ok(_) => println!("Stake has been approved"),
        Err(err) => println!("{:?}", err)
    };
}
```

KVStore client:

```rust
use human_protocol_sdk::escrow::EscrowClient;
use human_protocol_sdk::kvstore::KVStoreClient;
use human_protocol_sdk::staking::StakingClient;
use crate::constants::{NETWORKS};
use crate::enums::{ChainId};

fn main() {
    let network = NETWORKS.get(&ChainId::PolygonMumbai).unwrap();
    let transport = web3::transports::Http::new("NODE_ENDPOINT").unwrap();
    let web3 = web3::Web3::new(transport);
    let account: SecretKey = SecretKey::from_str("PRIVATE_KEY").unwrap();

    let kvstore_address = network.kvstore_address.to_string();

    let kvstore_client = KVStoreClient::new(&web3, kvstore_address, account).await;
    let key = "example_key".to_string();
    let value = "example_value".to_string();
        match kvstore_client.set(
        key,
        value
    ).await {
        Ok(_) => println!("Value has been set"),
        Err(err) => println!("{:?}", err)
    };
}
```