#![no_std]

multiversx_sc::imports!();

#[multiversx_sc::contract]
pub trait KVStoreContract {

    #[init]
    fn init(&self) {}

    #[endpoint(get)]
    fn get(&self, key: ManagedBuffer) -> ManagedBuffer {
        let sender = self.blockchain().get_caller();
        self.store(&sender, &key).get()
    }

    #[endpoint(set)]
    fn set(&self, key: ManagedBuffer, value: ManagedBuffer) {
        let sender = self.blockchain().get_caller();
        self.store(&sender, &key).set(&value);
        self.data_saved(sender, key, value);
    }

    #[storage_mapper("store")]
    fn store(&self, sender: &ManagedAddress, key: &ManagedBuffer) -> SingleValueMapper<ManagedBuffer>;

    #[event("data_saved")]
    fn data_saved(
        &self,
        #[indexed] sender: ManagedAddress,
        #[indexed] key: ManagedBuffer,
        value: ManagedBuffer
    );
}
