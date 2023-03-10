multiversx_sc::imports!();
multiversx_sc::derive_imports!();

pub const MAX_REPUTATION: u64 = 10_000;  // Meaning 100% reputation
pub const MIN_REPUTATION: u64 = 1_000;   // Meaning 10% reputation


#[derive(TopEncode, TopDecode, TypeAbi, PartialEq, Clone)]
pub struct Worker<T: ManagedTypeApi> {
    pub worker_address: ManagedAddress<T>,
    pub reputation: u64,
}