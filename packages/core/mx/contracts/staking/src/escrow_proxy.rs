use common_structs::escrow::EscrowStatus;

multiversx_sc::imports!();
multiversx_sc::derive_imports!();


mod escrow_proxy {
    use common_structs::escrow::EscrowStatus;

    multiversx_sc::imports!();
    multiversx_sc::derive_imports!();

    #[multiversx_sc::proxy]
    pub trait EscrowContract {

        #[view(getStatus)]
        fn get_status(&self) -> EscrowStatus;
        
    }
}

#[multiversx_sc::module]
pub trait EscrowProxyModule {

    fn get_status(&self, escrow_address: &ManagedAddress) -> EscrowStatus {
        self.staking_proxy(escrow_address.clone())
            .get_status()
            .execute_on_dest_context()
    }

    #[proxy]
    fn staking_proxy(&self, to: ManagedAddress) -> escrow_proxy::Proxy<Self::Api>;
}