multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, TypeAbi, Clone)]
pub struct Oracle<M: ManagedTypeApi> {
    pub address: ManagedAddress<M>,
    pub stake: BigUint<M>,
}

impl<M: ManagedTypeApi> Oracle<M> {
    pub fn new(address: ManagedAddress<M>, stake: BigUint<M>) -> Self {
        Self { address, stake }
    }
}

#[derive(TopEncode, TopDecode, TypeAbi)]
pub struct OraclePair<M: ManagedTypeApi> {
    pub reputation: Oracle<M>,
    pub recording: Oracle<M>,
}

impl<M: ManagedTypeApi> OraclePair<M> {
    pub fn new(
        reputation_address: &ManagedAddress<M>,
        reputation_stake: BigUint<M>,
        recording_address: &ManagedAddress<M>,
        recording_stake: BigUint<M>
    ) -> Self {
        Self {
            reputation: Oracle::new(reputation_address.clone(), reputation_stake),
            recording: Oracle::new(recording_address.clone(), recording_stake)
        }
    }
}

#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, TypeAbi, Debug, PartialEq, Eq)]
pub struct UrlHashPair<M: ManagedTypeApi> {
    pub url: ManagedBuffer<M>,
    pub hash: ManagedBuffer<M>,
}

impl<M: ManagedTypeApi> UrlHashPair<M> {
    pub fn new(url: ManagedBuffer<M>, hash: ManagedBuffer<M>) -> Self {
        Self { url, hash }
    }
}
