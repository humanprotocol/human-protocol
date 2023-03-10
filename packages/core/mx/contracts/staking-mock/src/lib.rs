#![no_std]

use common_structs::stakes::Staker;

multiversx_sc::imports!();

pub const MINIMUM_STAKE: u64 = 1_000_000;


#[multiversx_sc::contract]
pub trait StakingMockContract {

    #[init]
    fn init(&self) {}

    #[endpoint(getStaker)]
    fn get_staker(&self, _address: ManagedAddress) -> Staker<Self::Api> {
        Staker {
            token_staked: BigUint::from(MINIMUM_STAKE).mul(2 as u64),
            tokens_allocated: BigUint::zero(),
            tokens_locked: BigUint::zero(),
            tokens_locked_until: 0
        }
    }

    #[view(hasAvailableStake)]
    fn has_available_stake(&self, _address: ManagedAddress) -> bool {
        true
    }
}
