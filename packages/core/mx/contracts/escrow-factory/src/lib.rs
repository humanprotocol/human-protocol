#![no_std]
pub mod proxy;

multiversx_sc::imports!();

pub const STANDARD_DURATION: u64 = 8640000;

#[multiversx_sc::contract]
pub trait EscrowFactoryContract: proxy::StakingProxyModule {

    #[init]
    fn init(&self, staking: ManagedAddress) {
        self.staking_contract_address().set(&staking);
    }

    #[endpoint(createEscrow)]
    fn create_escrow(
        &self,
        token: TokenIdentifier,
        token_bulk_max_value: BigUint,
        trusted_handlers: MultiValueEncoded<ManagedAddress>,
    ) -> ManagedAddress {
        let caller = self.blockchain().get_caller();
        let has_available_stake = self.has_available_stake(&caller);
        require!(has_available_stake, "Needs to stake HMT tokens to create an escrow");

        let mut arguments = ManagedArgBuffer::new();
        arguments.push_arg(token.clone());
        arguments.push_arg(caller);
        arguments.push_arg(STANDARD_DURATION);
        arguments.push_arg(token_bulk_max_value);
        for handler in trusted_handlers.into_iter() {
            arguments.push_arg(handler);
        }

        let (escrow_address, _) = Self::Api::send_api_impl()
            .deploy_from_source_contract(
                self.blockchain().get_gas_left(),
                &BigUint::zero(),
                &self.escrow_template_address().get(),
                CodeMetadata::UPGRADEABLE | CodeMetadata::READABLE | CodeMetadata::PAYABLE,
                &arguments
            );

        let counter = self.counter().get() + 1;
        self.escrow_counter(&escrow_address).set(counter);
        self.counter().set(counter);

        self.escrow_launched_event(token, escrow_address.clone());

        escrow_address
    }

    #[view(isChild)]
    fn is_child(&self, address: ManagedAddress) -> bool {
        self.escrow_counter(&address).get() == self.counter().get()
    }

    #[view(hasEscrow)]
    fn has_escrow(&self, address: ManagedAddress) -> bool {
        !self.escrow_counter(&address).is_empty()
    }

    #[only_owner]
    #[endpoint(setTemplateAddress)]
    fn set_template_address(&self, address: ManagedAddress) {
        self.escrow_template_address().set(&address);
    }

    #[view(getTemplateAddress)]
    #[storage_mapper("escrow_template_address")]
    fn escrow_template_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[view(getEscrowCounter)]
    #[storage_mapper("escrow_counter")]
    fn escrow_counter(&self, escrow_address: &ManagedAddress) -> SingleValueMapper<u64>;

    #[view(getCounter)]
    #[storage_mapper("counter")]
    fn counter(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("last_escrow")]
    fn last_escrow(&self) -> SingleValueMapper<ManagedAddress>;

    #[event("escrow_launched")]
    fn escrow_launched_event(
        &self,
        #[indexed] token: TokenIdentifier,
        #[indexed] escrow_address: ManagedAddress
    );
}
