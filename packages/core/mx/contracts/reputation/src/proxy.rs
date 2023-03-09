multiversx_sc::imports!();

mod staking_proxy {
    multiversx_sc::imports!();

    #[multiversx_sc::proxy]
    pub trait StakingContract {
        #[endpoint(getStakedTokens)]
        fn get_staked_tokens(&self, address: ManagedAddress) -> BigUint;
    }
}

#[multiversx_sc::module]
pub trait StakingProxyModule {

    fn get_staked_proxy(&self, address: ManagedAddress) -> BigUint {
        self.staking_proxy(self.staking_contract_address().get())
            .get_staked_tokens(address)
            .execute_on_dest_context()
    }

    #[view(getStakingContractAddress)]
    #[storage_mapper("staking_contract_address")]
    fn staking_contract_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[proxy]
    fn staking_proxy(&self, to: ManagedAddress) -> staking_proxy::Proxy<Self::Api>;
}