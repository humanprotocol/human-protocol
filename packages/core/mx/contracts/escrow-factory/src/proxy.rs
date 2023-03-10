multiversx_sc::imports!();

mod staking_proxy {

    multiversx_sc::imports!();

    #[multiversx_sc::proxy]
    pub trait StakingContract {

        #[view(hasAvailableStake)]
        fn has_available_stake(&self, staker: ManagedAddress) -> bool;
    }
}

#[multiversx_sc::module]
pub trait StakingProxyModule {

    fn has_available_stake(&self, address: &ManagedAddress) -> bool {
        self.staking_proxy(self.staking_contract_address().get())
            .has_available_stake(address.clone())
            .execute_on_dest_context()
    }

    #[view(getStakingContractAddress)]
    #[storage_mapper("staking_contract_address")]
    fn staking_contract_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[proxy]
    fn staking_proxy(&self, to: ManagedAddress) -> staking_proxy::Proxy<Self::Api>;
}