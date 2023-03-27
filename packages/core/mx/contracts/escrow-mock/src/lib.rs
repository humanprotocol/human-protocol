#![no_std]

multiversx_sc::imports!();
use common_structs::escrow::EscrowStatus;


#[multiversx_sc::contract]
pub trait EscrowMockContract {

    #[init]
    fn init(&self) {}

    #[view(getStatus)]
    fn get_status(&self) -> EscrowStatus {
        self.status().get()
    }

    #[endpoint(setStatus)]
    fn set_status(&self, status: EscrowStatus) {
        self.status().set(&status);
    }

    #[storage_mapper("status")]
    fn status(&self) -> SingleValueMapper<EscrowStatus>;
}
