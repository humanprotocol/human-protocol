multiversx_sc::imports!();
multiversx_sc::derive_imports!();


mod reward_pool_proxy {
    multiversx_sc::imports!();
    multiversx_sc::derive_imports!();

    #[multiversx_sc::proxy]
    pub trait RewardPoolContract {

        #[endpoint(addReward)]
        fn add_reward(
            &self,
            escrow_address: ManagedAddress,
            slasher: ManagedAddress,
            tokens: BigUint
        );
    }
}

#[multiversx_sc::module]
pub trait RewardsPoolProxyModule {

    fn add_reward(
        &self,
        escrow_address: ManagedAddress,
        slasher: ManagedAddress,
        tokens: BigUint,
        rewards_pool_contract_address: ManagedAddress
    ) {

        self.reward_pool_proxy(rewards_pool_contract_address)
            .add_reward(escrow_address, slasher, tokens)
            .execute_on_dest_context()
    }

    #[proxy]
    fn reward_pool_proxy(&self, to: ManagedAddress) -> reward_pool_proxy::Proxy<Self::Api>;
}