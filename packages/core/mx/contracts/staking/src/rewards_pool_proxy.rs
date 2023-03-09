multiversx_sc::imports!();
multiversx_sc::derive_imports!();


mod reward_pool_proxy {
    multiversx_sc::imports!();
    multiversx_sc::derive_imports!();

    #[multiversx_sc::proxy]
    pub trait RewardPoolContract {

        #[endpoint(addRewards)]
        fn add_rewards(&self, escrow_address: ManagedAddress, slasher: ManagedAddress);
    }
}

#[multiversx_sc::module]
pub trait RewardsPoolProxyModule {

    fn add_rewards(&self, payment: EsdtTokenPayment, escrow_address: ManagedAddress, slasher: ManagedAddress) {
        let rewards_pool_contract_address = self.rewards_pool_contract_address().get();
        self.reward_pool_proxy(rewards_pool_contract_address)
            .add_rewards(escrow_address, slasher)
            .with_esdt_transfer(payment)
            .execute_on_dest_context()
    }

    #[storage_mapper("rewards_pool_contract_address")]
    fn rewards_pool_contract_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[proxy]
    fn reward_pool_proxy(&self, to: ManagedAddress) -> reward_pool_proxy::Proxy<Self::Api>;
}