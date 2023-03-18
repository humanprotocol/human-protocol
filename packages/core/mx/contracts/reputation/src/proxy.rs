use common_structs::stakes::Staker;

multiversx_sc::imports!();

mod staking_proxy {
    use common_structs::stakes::Staker;

    multiversx_sc::imports!();

    #[multiversx_sc::proxy]
    pub trait StakingContract {

        #[endpoint(getStaker)]
        fn get_staker(&self, staker: ManagedAddress) -> Staker<Self::Api>;
    }
}

#[multiversx_sc::module]
pub trait StakingProxyModule {

    fn get_staker(&self, address: ManagedAddress) -> Staker<Self::Api> {
        self.staking_proxy(self.staking_contract_address().get())
            .get_staker(address)
            .execute_on_dest_context()
    }

    #[view(getStakingContractAddress)]
    #[storage_mapper("staking_contract_address")]
    fn staking_contract_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[proxy]
    fn staking_proxy(&self, to: ManagedAddress) -> staking_proxy::Proxy<Self::Api>;
}