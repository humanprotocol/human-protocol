multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, TypeAbi, Clone)]
pub struct Oracle<M: ManagedTypeApi> {
    pub address: ManagedAddress<M>,
    pub stake: BigUint<M>,
}

impl<M: ManagedTypeApi> Oracle<M> {
    pub fn new(address: ManagedAddress<M>, stake: BigUint<M>) -> Self { Self { address, stake } }
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



