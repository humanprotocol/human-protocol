multiversx_sc::imports!();
multiversx_sc::derive_imports!();

pub type Rewards<T> = ManagedVec<T, Reward<T>>;


#[derive(NestedEncode, NestedDecode, TopEncode, TopDecode, TypeAbi, PartialEq, Clone, ManagedVecItem)]
pub struct Reward<T: ManagedTypeApi> {
    pub escrow_address: ManagedAddress<T>,
    pub slasher: ManagedAddress<T>,
    pub tokens: BigUint<T>,
}