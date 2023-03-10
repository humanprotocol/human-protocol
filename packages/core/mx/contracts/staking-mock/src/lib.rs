#![no_std]

multiversx_sc::imports!();

pub const MINIMUM_STAKE: u64 = 1000000;


#[multiversx_sc::contract]
pub trait StakingMockContract {

    #[init]
    fn init(&self) {}

    #[endpoint(getStakedTokens)]
    fn get_staked_tokens(&self, _address: ManagedAddress) -> BigUint {
        BigUint::from(MINIMUM_STAKE)
    }
}
