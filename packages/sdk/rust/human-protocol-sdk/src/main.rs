pub mod escrow;
pub mod macros;
pub mod enums;
pub mod constants;
pub mod events;
pub mod kvstore;
pub mod staking;

pub mod graphql {
    pub mod escrows_query;
    pub mod escrow_query;
    pub mod staking_leaders_query;
    pub mod staking_leader_query;
    pub mod staking_rewards_query;
}

#[tokio::main]
async fn main() -> web3::Result<()>  {
    Ok(())
}
