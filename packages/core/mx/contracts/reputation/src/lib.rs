#![no_std]

pub mod constants;
pub mod proxy;

use constants::{Worker, MAX_REPUTATION, MIN_REPUTATION};
multiversx_sc::imports!();

#[multiversx_sc::contract]
pub trait ReputationContract: proxy::StakingProxyModule {

    #[init]
    fn init(&self, staking_contract_address: ManagedAddress, staking_minimum_amount: BigUint) {
        self.staking_contract_address().set_if_empty(&staking_contract_address);
        self.staking_minimum_amount().set_if_empty(&staking_minimum_amount);
    }

    #[endpoint(addReputation)]
    fn add_reputation(&self, workers: MultiValueEncoded<Worker<Self::Api>>) {
        let staker_address = self.blockchain().get_caller();
        let staker = self.get_staker(staker_address.clone());
        require!(staker.tokens_available() >= self.staking_minimum_amount().get(), "Needs to stake HMT tokens to modify reputations.");

        for worker in workers.into_iter() {
            let reputation = self.reputations(&worker.worker_address).get();

            if ((&reputation + &worker.reputation) > MAX_REPUTATION) ||
                (reputation == 0 && (&worker.reputation + 5_000u64) > MAX_REPUTATION) {
                self.reputations(&worker.worker_address).set(MAX_REPUTATION);
            } else if (reputation == 0 && (&worker.reputation + 5_000u64) < MIN_REPUTATION) ||
                    ((reputation + worker.reputation) < MIN_REPUTATION && reputation != 0) {
                self.reputations(&worker.worker_address).set(MIN_REPUTATION);
            } else {
                if reputation == 0 {
                    let new_worker_reputation = worker.reputation + 5_000u64;
                    self.reputations(&worker.worker_address).set(new_worker_reputation);
                } else {
                    let new_worker_reputation = reputation + worker.reputation;
                    self.reputations(&worker.worker_address).set(new_worker_reputation);
                }
            }
        }
    }

    #[only_owner]
    #[endpoint(setStakingContractAddress)]
    fn set_staking_contract_address(&self, staking_contract_address: ManagedAddress) {
        self.staking_contract_address().set(&staking_contract_address);
    }

    #[only_owner]
    #[endpoint(setMinimumStake)]
    fn set_staking_minimum_amount(&self, staking_minimum_amount: BigUint) {
        self.staking_minimum_amount().set(&staking_minimum_amount);
    }

    #[view(getReputations)]
    fn get_reputations(&self, workers: MultiValueEncoded<ManagedAddress>) -> MultiValueEncoded<Worker<Self::Api>> {
        let mut returned_values: MultiValueEncoded<Worker<Self::Api>> = MultiValueEncoded::new();

        for worker in workers.into_iter() {
            let reputation = self.reputations(&worker).get();
            let worker = Worker {
                worker_address: worker,
                reputation,
            };
            returned_values.push(worker);
        }

        returned_values
    }

    #[view(getRewards)]
    fn get_rewards(&self, balance: BigUint, workers: MultiValueEncoded<ManagedAddress>) -> MultiValueEncoded<BigUint> {
        require!(balance > 0, "Balance should be greater than 0");
        require!(workers.len() > 0, "Workers should be greater than 0");

        let mut returned_values: MultiValueEncoded<BigUint> = MultiValueEncoded::new();
        let mut total_reputation = 0u64;

        for worker in workers.clone().into_iter() {
            let reputation = self.reputations(&worker).get();
            total_reputation += &reputation;
        }

        require!(total_reputation != 0, "Total reputation is 0");

        for worker in workers.into_iter() {
            let reputation = self.reputations(&worker).get();
            let reward = &balance * reputation / total_reputation;
            returned_values.push(reward);
        }
        returned_values
    }

    #[view(getMinimumStake)]
    #[storage_mapper("staking_minimum_amount")]
    fn staking_minimum_amount(&self) -> SingleValueMapper<BigUint>;

    #[view(getAddressReputation)]
    #[storage_mapper("reputations")]
    fn reputations(&self, address: &ManagedAddress) -> SingleValueMapper<u64>;
}
