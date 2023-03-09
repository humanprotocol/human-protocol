multiversx_sc::imports!();
multiversx_sc::derive_imports!();

pub const MAX_REPUTATION: u64 = 100;
pub const MIN_REPUTATION: u64 = 0;


#[derive(TopEncode, TopDecode, TypeAbi, PartialEq, Clone)]
pub struct Worker<T: ManagedTypeApi> {
    pub worker_address: ManagedAddress<T>,
    pub reputation: u64,
}